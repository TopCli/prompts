// Import Node.js Dependencies
import { EOL } from "node:os";
import { styleText } from "node:util";

// Import Third-party Dependencies
import wcwidth from "@topcli/wcwidth";

// Import Internal Dependencies
import { AbstractPrompt, type AbstractPromptOptions } from "./abstract.js";
import { stripAnsi } from "../utils.js";
import { SYMBOLS } from "../constants.js";
import { isValid, type PromptValidator, resultError } from "../validators.js";
import { type Choice } from "../types.js";

// CONSTANTS
const kRequiredChoiceProperties = ["label", "value"];

export interface MultiselectOptions<T extends string> extends AbstractPromptOptions {
  choices: (Choice<T> | T)[];
  maxVisible?: number;
  preSelectedChoices?: (Choice | T)[];
  validators?: PromptValidator<T[]>[];
  autocomplete?: boolean;
  caseSensitive?: boolean;
  showHint?: boolean;
}

type VoidFn = () => void;

export class MultiselectPrompt<T extends string> extends AbstractPrompt<string | string[]> {
  #boundExitEvent: VoidFn = () => void 0;
  #boundKeyPressEvent: VoidFn = () => void 0;
  #validators: PromptValidator<T[]>[];
  #showHint: boolean;

  activeIndex = 0;
  selectedIndexes: Set<number> = new Set();
  questionMessage: string;
  autocompleteValue = "";
  options: MultiselectOptions<T>;
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

  #filterChoice(choice: T | Choice | string, autocompleteValue: string, isCaseSensitive = false) {
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

      return (choice as Choice<T>).label.length;
    }));
  }

  constructor(options: MultiselectOptions<T>) {
    const {
      choices,
      preSelectedChoices = [],
      validators = [],
      showHint = true,
      ...baseOptions
    } = options;

    super({ ...baseOptions });

    this.options = options;

    if (!choices?.length) {
      this.destroy();
      throw new TypeError("Missing required param: choices");
    }

    this.#validators = validators;
    this.#showHint = showHint;

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

    for (const choice of preSelectedChoices) {
      const choiceIndex = this.filteredChoices.findIndex((item) => {
        if (typeof item === "string") {
          return item === choice;
        }

        return item.value === choice;
      });

      if (choiceIndex === -1) {
        this.destroy();
        throw new Error(`Invalid pre-selected choice: ${typeof choice === "string" ? choice : choice.value}`);
      }

      this.selectedIndexes.add(choiceIndex);
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
      const isChoiceActive = choiceIndex === this.activeIndex;
      const isChoiceSelected = this.selectedIndexes.has(choiceIndex);
      const showPreviousChoicesArrow = startIndex > 0 && choiceIndex === startIndex;
      const showNextChoicesArrow = endIndex < this.filteredChoices.length && choiceIndex === endIndex - 1;

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
      const styles = isChoiceActive ? ["white" as const, "bold" as const] : ["gray" as const];
      const str = `${prefix} ${styleText(styles, `${formattedLabel}${formattedDescription}`)}${EOL}`;

      this.write(str);
    }
  }

  #showAnsweredQuestion(choices: string, isAgentAnswer = false) {
    const prefixSymbol = this.selectedIndexes.size === 0 && !isAgentAnswer ? SYMBOLS.Cross : SYMBOLS.Tick;
    const prefix = `${prefixSymbol} ${styleText("bold", this.message)} ${SYMBOLS.Pointer}`;
    const formattedChoice = styleText("yellow", choices);

    this.write(`${prefix}${choices ? ` ${formattedChoice}` : ""}${EOL}`);
  }

  #selectedChoices() {
    return [...this.selectedIndexes].reduce(
      (acc, index) => {
        const choice = this.filteredChoices[index];

        if (typeof choice === "string") {
          acc.values.push(choice);
          acc.labels.push(choice);
        }
        else {
          acc.values.push(choice.value);
          acc.labels.push(choice.label as T);
        }

        return acc;
      },
      {
        values: [] as T[],
        labels: [] as T[]
      }
    );
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
    else if (key.ctrl && key.name === "a") {
      this.selectedIndexes = this.selectedIndexes.size === this.filteredChoices.length ?
        new Set() :
        new Set(this.filteredChoices.map((_, index) => index));
      render();
    }
    else if (key.name === "right") {
      this.selectedIndexes.add(this.activeIndex);
      render();
    }
    else if (key.name === "left") {
      this.selectedIndexes = new Set([...this.selectedIndexes].filter((index) => index !== this.activeIndex));
      render();
    }
    else if (key.name === "return") {
      const { values, labels } = this.#selectedChoices();

      for (const validator of this.#validators) {
        const validationResult = validator.validate(values);

        if (isValid(validationResult) === false) {
          render({ error: resultError(validationResult) });

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
      if (!key.ctrl && this.options.autocomplete) {
        // reset selected choices when user type
        this.selectedIndexes.clear();
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

  async multiselect(): Promise<string[]> {
    if (this.skip) {
      this.destroy();
      const { values } = this.#selectedChoices();

      return values;
    }

    return new Promise((resolve, reject) => {
      const answer = this.agent.nextAnswers.shift();
      if (answer !== undefined) {
        const formatedAnser = Array.isArray(answer) ? answer.join(", ") : answer;
        this.#showAnsweredQuestion(formatedAnser, true);
        this.destroy();

        resolve(Array.isArray(answer) ? answer : [answer]);

        return;
      }

      this.once("error", (error) => {
        reject(error);
      });

      this.write(SYMBOLS.HideCursor);
      this.#showQuestion();

      const render = (
        options: {
          initialRender?: boolean;
          clearRender?: boolean;
          error?: string;
        } = {}
      ) => {
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

        if (error) {
          const linesToClear = Math.ceil(wcwidth(this.questionMessage) / this.stdout.columns) + 1;
          this.stdout.moveCursor(0, -linesToClear);
          this.stdout.clearScreenDown();
          this.#showQuestion(error);
        }

        this.#showChoices();
      };

      render({ initialRender: true });

      this.#boundKeyPressEvent = this.#onKeypress.bind(this, resolve, render);
      this.stdin.on("keypress", this.#boundKeyPressEvent);

      this.#boundExitEvent = this.#onProcessExit.bind(this);
      process.once("exit", this.#boundExitEvent);
    });
  }

  #showQuestion(error: string | null = null) {
    let hint = this.#showHint ? styleText("gray",
      // eslint-disable-next-line @stylistic/max-len
      `(Press ${styleText("bold", "<Ctrl+A>")} to toggle all, ${styleText("bold", "<Left/Right>")} to toggle, ${styleText("bold", "<Return>")} to submit)`
    ) : "";
    if (error) {
      hint += `${hint.length > 0 ? " " : ""}${styleText(["red", "bold"], `[${error}]`)}`;
    }
    this.questionMessage = `${SYMBOLS.QuestionMark} ${styleText("bold", this.message)}${hint.length > 0 ? ` ${hint}` : ""}`;

    this.write(`${this.questionMessage}${EOL}`);
  }
}
