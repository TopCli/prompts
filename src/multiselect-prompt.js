// Import Node.js Dependencies
import { EOL } from "node:os";

// Import Third-party Dependencies
import kleur from "kleur";
import stripAnsi from "strip-ansi";
import wcwidth from "@topcli/wcwidth";

// Import Internal Dependencies
import { AbstractPrompt } from "./abstract-prompt.js";
import { SYMBOLS } from "./constants.js";

export class MultiselectPrompt extends AbstractPrompt {
  #boundExitEvent = () => void 0;
  #boundKeyPressEvent = () => void 0;
  #validators;

  activeIndex = 0;
  selectedIndexes = [];
  questionMessage;

  get choices() {
    return this.options.choices;
  }

  constructor(message, options) {
    const {
      stdin = process.stdin,
      stdout = process.stdout,
      choices,
      preSelectedChoices,
      validators = []
    } = options ?? {};

    super(message, stdin, stdout);

    if (!options) {
      this.destroy();
      throw new TypeError("Missing required options");
    }

    this.options = options;

    if (!choices?.length) {
      this.destroy();
      throw new TypeError("Missing required param: choices");
    }

    this.longestChoice = Math.max(...choices.map((choice) => {
      if (typeof choice === "string") {
        return choice.length;
      }

      const kRequiredChoiceProperties = ["label", "value"];

      for (const prop of kRequiredChoiceProperties) {
        if (!choice[prop]) {
          this.destroy();
          throw new TypeError(`Missing ${prop} for choice ${JSON.stringify(choice)}`);
        }
      }

      return choice.label.length;
    }));

    this.#validators = validators;

    if (!preSelectedChoices) {
      return;
    }

    for (const choice of preSelectedChoices) {
      const choiceIndex = this.choices.findIndex((item) => {
        if (typeof item === "string") {
          return item === choice;
        }

        return item.value === choice;
      });

      if (choiceIndex === -1) {
        throw new Error(`Invalid pre-selected choice: ${choice.value ?? choice}`);
      }

      this.selectedIndexes.push(choiceIndex);
    }
  }

  #getFormattedChoice(choiceIndex) {
    const choice = this.choices[choiceIndex];

    if (typeof choice === "string") {
      return { value: choice, label: choice };
    }

    return choice;
  }

  #getVisibleChoices() {
    const maxVisible = this.options.maxVisible || 8;
    let startIndex = Math.min(this.choices.length - maxVisible, this.activeIndex - Math.floor(maxVisible / 2));
    if (startIndex < 0) {
      startIndex = 0;
    }

    const endIndex = Math.min(startIndex + maxVisible, this.choices.length);

    return { startIndex, endIndex };
  }

  #showChoices() {
    const { startIndex, endIndex } = this.#getVisibleChoices();
    this.lastRender = { startIndex, endIndex };

    for (let choiceIndex = startIndex; choiceIndex < endIndex; choiceIndex++) {
      const choice = this.#getFormattedChoice(choiceIndex);
      const isChoiceActive = choiceIndex === this.activeIndex;
      const isChoiceSelected = this.selectedIndexes.includes(choiceIndex);
      const showPreviousChoicesArrow = startIndex > 0 && choiceIndex === startIndex;
      const showNextChoicesArrow = endIndex < this.choices.length && choiceIndex === endIndex - 1;

      let prefixArrow = "  ";
      if (showPreviousChoicesArrow) {
        prefixArrow = SYMBOLS.Previous + " ";
      }
      else if (showNextChoicesArrow) {
        prefixArrow = SYMBOLS.Next + " ";
      }

      const prefix = `${prefixArrow}${isChoiceSelected ? SYMBOLS.Active : SYMBOLS.Inactive}`;
      const formattedLabel = choice.label.padEnd(
        this.longestChoice < 10 ? this.longestChoice : 0
      );
      const formattedDescription = choice.description ? ` - ${choice.description}` : "";
      const color = isChoiceActive ? kleur.white().bold : kleur.gray;
      const str = `${prefix} ${color(`${formattedLabel}${formattedDescription}`)}${EOL}`;

      this.write(str);
    }
  }

  #showAnsweredQuestion(choices, isAgentAnswer = false) {
    const prefixSymbol = this.selectedIndexes.length === 0 && !isAgentAnswer ? SYMBOLS.Cross : SYMBOLS.Tick;
    const prefix = `${prefixSymbol} ${kleur.bold(this.message)} ${SYMBOLS.Pointer}`;
    const formattedChoice = kleur.yellow(choices);

    this.write(`${prefix}${choices ? ` ${formattedChoice}` : ""}${EOL}`);
  }

  #onProcessExit() {
    this.stdin.off("keypress", this.#boundKeyPressEvent);
    this.stdout.moveCursor(-this.stdout.columns, 0);
    this.stdout.clearScreenDown();
    this.write(SYMBOLS.ShowCursor);
  }

  #onKeypress(...args) {
    const [resolve, render, _, key] = args;

    if (key.name === "up") {
      this.activeIndex = this.activeIndex === 0 ? this.choices.length - 1 : this.activeIndex - 1;
      render();
    }
    else if (key.name === "down") {
      this.activeIndex = this.activeIndex === this.choices.length - 1 ? 0 : this.activeIndex + 1;
      render();
    }
    else if (key.name === "a") {
      this.selectedIndexes = this.selectedIndexes.length === this.choices.length ? [] : this.choices.map((_, index) => index);
      render();
    }
    else if (key.name === "space") {
      const isChoiceSelected = this.selectedIndexes.includes(this.activeIndex);

      if (isChoiceSelected) {
        this.selectedIndexes = this.selectedIndexes.filter((index) => index !== this.activeIndex);
      }
      else {
        this.selectedIndexes.push(this.activeIndex);
      }

      render();
    }
    else if (key.name === "return") {
      const labels = this.selectedIndexes.map((index) => this.choices[index].label ?? this.choices[index]);
      const values = this.selectedIndexes.map((index) => this.choices[index].value ?? this.choices[index]);

      for (const validator of this.#validators) {
        if (!validator.validate(values)) {
          const error = validator.error(values);
          render({ error });

          return;
        }
      }

      render({ clearRender: true });

      this.#showAnsweredQuestion(labels.join(", "));

      this.write(SYMBOLS.ShowCursor);
      this.destroy();

      this.#onProcessExit();
      process.off("exit", this.#boundExitEvent);

      resolve(values);
    }
    else {
      render();
    }
  }

  async multiselect() {
    if (this.agent.nextAnswers.length > 0) {
      const answer = this.agent.nextAnswers.shift();
      this.#showAnsweredQuestion(answer, true);
      this.destroy();

      return answer;
    }

    this.write(SYMBOLS.HideCursor);
    this.#showQuestion();

    const render = (options = {}) => {
      const {
        initialRender = false,
        clearRender = false,
        error = null
      } = options;

      if (!initialRender) {
        let linesToClear = this.lastRender.endIndex - this.lastRender.startIndex;
        while (linesToClear > 0) {
          this.clearLastLine();
          linesToClear--;
        }
      }

      if (clearRender) {
        const questionLineCount = Math.ceil(
          wcwidth(stripAnsi(this.questionMessage)) / this.stdout.columns
        );
        this.stdout.moveCursor(-this.stdout.columns, -(1 + questionLineCount));
        this.stdout.clearScreenDown();

        return;
      }

      if (error) {
        this.stdout.moveCursor(0, -2);
        this.stdout.clearScreenDown();
        this.#showQuestion(error);
      }

      this.#showChoices();
    };

    render({ initialRender: true });

    return new Promise((resolve) => {
      this.#boundKeyPressEvent = this.#onKeypress.bind(this, resolve, render);
      this.stdin.on("keypress", this.#boundKeyPressEvent);

      this.#boundExitEvent = this.#onProcessExit.bind(this);
      process.once("exit", this.#boundExitEvent);
    });
  }

  #showQuestion(error = null) {
    let hint = kleur.gray(
      `(Press ${kleur.bold("<a>")} to toggle all, ${kleur.bold("<space>")} to select, ${kleur.bold("<return>")} to submit)`
    );
    if (error) {
      hint += ` ${kleur.red().bold(`[${error}]`)}`;
    }
    this.questionMessage = `${SYMBOLS.QuestionMark} ${kleur.bold(this.message)} ${hint}`;

    this.write(`${this.questionMessage}${EOL}`);
  }
}
