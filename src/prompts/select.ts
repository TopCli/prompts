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

// CONSTANTS
const kRequiredChoiceProperties = ["label", "value"];

export interface SelectOptions extends SharedOptions {
  choices: (Choice | string)[];
  maxVisible?: number;
  ignoreValues?: (string | number | boolean)[];
  autocomplete?: boolean;
  caseSensitive?: boolean;
}

export class SelectPrompt extends AbstractPrompt<string> {
  #boundExitEvent = () => void 0;
  #boundKeyPressEvent = () => void 0;
  activeIndex = 0;
  questionMessage: string;
  autocompleteValue = "";
  options: SelectOptions;
  lastRender: { startIndex: number; endIndex: number; };

  get choices() {
    return this.options.choices;
  }

  get filteredChoices() {
    if (!(this.options.autocomplete && this.autocompleteValue.length > 0)) {
      return this.choices;
    }

    const isCaseSensitive = this.options.caseSensitive;
    const autocompleteValue = isCaseSensitive ? this.autocompleteValue : this.autocompleteValue.toLowerCase();

    return this.choices.filter((choice) => this.#filterChoice(choice, autocompleteValue, isCaseSensitive));
  }

  #filterChoice(choice: Choice | string, autocompleteValue: string, isCaseSensitive = false) {
    // eslint-disable-next-line no-nested-ternary
    const choiceValue = typeof choice === "string" ?
      (isCaseSensitive ? choice : choice.toLowerCase()) :
      (isCaseSensitive ? choice.label : choice.label.toLowerCase());

    if (autocompleteValue.includes(" ")) {
      return this.#filterMultipleWords(choiceValue, autocompleteValue, isCaseSensitive);
    }

    return choiceValue.includes(autocompleteValue);
  }

  #filterMultipleWords(choiceValue: string, autocompleteValue: string, isCaseSensitive: boolean) {
    return autocompleteValue.split(" ").every((word) => {
      const wordValue = isCaseSensitive ? word : word.toLowerCase();

      return choiceValue.includes(wordValue) || choiceValue.includes(autocompleteValue);
    });
  }

  get longestChoice() {
    return Math.max(...this.filteredChoices.map((choice) => {
      if (typeof choice === "string") {
        return choice.length;
      }

      return choice.label.length;
    }));
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

    for (const choice of choices) {
      if (typeof choice === "string") {
        continue;
      }

      for (const prop of kRequiredChoiceProperties) {
        if (!choice[prop]) {
          this.destroy();
          throw new TypeError(`Missing ${prop} for choice ${JSON.stringify(choice)}`);
        }
      }
    }
  }

  #getFormattedChoice(choiceIndex: number) {
    const choice = this.filteredChoices[choiceIndex];

    if (typeof choice === "string") {
      return { value: choice, label: choice };
    }

    return choice;
  }

  #getVisibleChoices() {
    const maxVisible = this.options.maxVisible || 8;
    let startIndex = Math.min(this.filteredChoices.length - maxVisible, this.activeIndex - Math.floor(maxVisible / 2));
    if (startIndex < 0) {
      startIndex = 0;
    }

    const endIndex = Math.min(startIndex + maxVisible, this.filteredChoices.length);

    return { startIndex, endIndex };
  }

  #showChoices() {
    const { startIndex, endIndex } = this.#getVisibleChoices();
    this.lastRender = { startIndex, endIndex };

    if (this.options.autocomplete) {
      this.write(`${SYMBOLS.Pointer} ${this.autocompleteValue}${EOL}`);
    }
    for (let choiceIndex = startIndex; choiceIndex < endIndex; choiceIndex++) {
      const choice = this.#getFormattedChoice(choiceIndex);
      const isChoiceSelected = choiceIndex === this.activeIndex;
      const showPreviousChoicesArrow = startIndex > 0 && choiceIndex === startIndex;
      const showNextChoicesArrow = endIndex < this.filteredChoices.length && choiceIndex === endIndex - 1;

      let prefixArrow = " ";
      if (showPreviousChoicesArrow) {
        prefixArrow = SYMBOLS.Previous;
      }
      else if (showNextChoicesArrow) {
        prefixArrow = SYMBOLS.Next;
      }

      const prefix = `${prefixArrow}${isChoiceSelected ? `${SYMBOLS.Pointer} ` : "  "}`;
      const formattedLabel = choice.label.padEnd(
        this.longestChoice < 10 ? this.longestChoice : 0
      );
      const formattedDescription = choice.description ? ` - ${choice.description}` : "";
      const color = isChoiceSelected ? kleur.white().bold : kleur.gray;
      const str = `${prefix}${color(`${formattedLabel}${formattedDescription}`)}${EOL}`;

      this.write(str);
    }
  }

  #showAnsweredQuestion(choice: Choice | string) {
    const symbolPrefix = choice === "" ? SYMBOLS.Cross : SYMBOLS.Tick;
    const prefix = `${symbolPrefix} ${kleur.bold(this.message)} ${SYMBOLS.Pointer}`;
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
      this.activeIndex = this.activeIndex === 0 ? this.filteredChoices.length - 1 : this.activeIndex - 1;
      render();
    }
    else if (key.name === "down") {
      this.activeIndex = this.activeIndex === this.filteredChoices.length - 1 ? 0 : this.activeIndex + 1;
      render();
    }
    else if (key.name === "return") {
      const choice = this.filteredChoices[this.activeIndex] || "";

      const label = typeof choice === "string" ? choice : choice.label;
      const value = typeof choice === "string" ? choice : choice.value;
      render({ clearRender: true });
      if (!this.options.ignoreValues?.includes(value)) {
        this.#showAnsweredQuestion(label);
      }

      this.write(SYMBOLS.ShowCursor);
      this.destroy();

      this.#onProcessExit();
      process.off("exit", this.#boundExitEvent);

      resolve(value);
    }
    else {
      if (!key.ctrl && this.options.autocomplete) {
        // reset selected choices when user type
        this.activeIndex = 0;
        if (key.name === "backspace" && this.autocompleteValue.length > 0) {
          this.autocompleteValue = this.autocompleteValue.slice(0, -1);
        }
        else if (key.name !== "backspace") {
          this.autocompleteValue += key.sequence;
        }
      }
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
        if (this.options.autocomplete) {
          let linesToClear = Math.ceil(
            wcwidth(`${SYMBOLS.Pointer} ${this.autocompleteValue}`) / this.stdout.columns
          );
          while (linesToClear > 0) {
            this.clearLastLine();
            linesToClear--;
          }
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
