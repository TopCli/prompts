// Import Node.js Dependencies
import { EOL } from "node:os";

// Import Third-party Dependencies
import kleur from "kleur";
import wcwidth from "@topcli/wcwidth";

// Import Internal Dependencies
import { AbstractPrompt } from "./abstract.js";
import { stripAnsi } from "../utils.js";
import { SYMBOLS } from "../constants.js";
import { Choice, SharedOptions } from "../types.js";

export interface SelectOptions extends SharedOptions {
  choices: (Choice | string)[];
  maxVisible?: number;
  ignoreValues?: (string | number | boolean)[];
}

export class SelectPrompt extends AbstractPrompt<string> {
  #boundExitEvent = () => void 0;
  #boundKeyPressEvent = () => void 0;
  activeIndex = 0;
  selectedIndexes: number[] = [];
  questionMessage: string;
  longestChoicelength: number;
  options: SelectOptions;
  lastRender: { startIndex: number; endIndex: number; };

  get choices() {
    return this.options.choices;
  }

  constructor(message: string, options: SelectOptions) {
    const {
      stdin = process.stdin,
      stdout = process.stdout,
      choices
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

    this.longestChoicelength = Math.max(...choices.map((choice) => {
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
  }

  #getFormattedChoice(choiceIndex: number) {
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
      const isChoiceSelected = choiceIndex === this.activeIndex;
      const showPreviousChoicesArrow = startIndex > 0 && choiceIndex === startIndex;
      const showNextChoicesArrow = endIndex < this.choices.length && choiceIndex === endIndex - 1;

      let prefixArrow = " ";
      if (showPreviousChoicesArrow) {
        prefixArrow = SYMBOLS.Previous;
      }
      else if (showNextChoicesArrow) {
        prefixArrow = SYMBOLS.Next;
      }

      const prefix = `${prefixArrow}${isChoiceSelected ? `${SYMBOLS.Pointer} ` : "  "}`;
      const formattedLabel = choice.label.padEnd(
        this.longestChoicelength < 10 ? this.longestChoicelength : 0
      );
      const formattedDescription = choice.description ? ` - ${choice.description}` : "";
      const color = isChoiceSelected ? kleur.white().bold : kleur.gray;
      const str = color(`${prefix}${formattedLabel}${formattedDescription}${EOL}`);

      this.write(str);
    }
  }

  #showAnsweredQuestion(choice: Choice | string) {
    const prefix = `${SYMBOLS.Tick} ${kleur.bold(this.message)} ${SYMBOLS.Pointer}`;
    const formattedChoice = kleur.yellow(typeof choice === "string" ? choice : choice.label);

    this.write(`${prefix} ${formattedChoice}${EOL}`);
  }

  #onProcessExit() {
    this.stdin.off("keypress", this.#boundKeyPressEvent);
    this.stdout.moveCursor(-this.stdout.columns, 0);
    this.stdout.clearScreenDown();
    this.write(SYMBOLS.ShowCursor);
  }

  #onKeypress(...args) {
    const [resolve, render, , key] = args;

    if (key.name === "up") {
      this.activeIndex = this.activeIndex === 0 ? this.choices.length - 1 : this.activeIndex - 1;
      render();
    }
    else if (key.name === "down") {
      this.activeIndex = this.activeIndex === this.choices.length - 1 ? 0 : this.activeIndex + 1;
      render();
    }
    else if (key.name === "return") {
      render({ clearRender: true });

      const currentChoice = this.choices[this.activeIndex];
      const value = typeof currentChoice === "string" ? currentChoice : currentChoice.value;
      if (!this.options.ignoreValues?.includes(value)) {
        this.#showAnsweredQuestion(currentChoice);
      }

      this.write(SYMBOLS.ShowCursor);
      this.destroy();

      this.#onProcessExit();
      process.off("exit", this.#boundExitEvent);
      resolve(value);
    }
    else {
      render();
    }
  }

  async select(): Promise<string> {
    const answer = this.agent.nextAnswers.shift();
    if (answer !== undefined) {
      this.#showAnsweredQuestion(answer);
      this.destroy();

      return answer;
    }

    this.write(SYMBOLS.HideCursor);
    this.#showQuestion();

    const render = (
      options: {
        initialRender?: boolean;
        clearRender?: boolean;
      } = {}
    ) => {
      const {
        initialRender = false,
        clearRender = false
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

  #showQuestion() {
    this.questionMessage = `${SYMBOLS.QuestionMark} ${kleur.bold(this.message)}`;
    this.write(`${this.questionMessage}${EOL}`);
  }
}
