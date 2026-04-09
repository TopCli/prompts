// Import Node.js Dependencies
import { EOL } from "node:os";
import { styleText, type InspectColor } from "node:util";

// Import Internal Dependencies
import { AbstractPrompt, type AbstractPromptOptions } from "./abstract.ts";
import { stringLength, isSeparator } from "../utils.ts";
import { SYMBOLS, VALIDATION_SPINNER_INTERVAL } from "../constants.ts";
import { isValid, type PromptValidator, resultError } from "../validators.ts";
import { type ValidationResponse } from "./../validators.ts";
import { type Choice, type Separator } from "../types.ts";

// CONSTANTS
const kRequiredChoiceProperties = ["label", "value"];

export interface SelectOptions<T extends string> extends AbstractPromptOptions {
  choices: (Choice<T> | T | Separator)[];
  maxVisible?: number;
  ignoreValues?: (T | number | boolean)[];
  validators?: PromptValidator<string>[];
  autocomplete?: boolean;
  caseSensitive?: boolean;
}

type VoidFn = () => void;
type RenderOptions = {
  initialRender?: boolean;
  clearRender?: boolean;
  error?: string;
  validating?: string;
};

export class SelectPrompt<T extends string> extends AbstractPrompt<T> {
  #boundExitEvent: VoidFn = () => void 0;
  #boundKeyPressEvent: VoidFn = () => void 0;
  #validators: PromptValidator<string>[];
  #isValidating = false;
  activeIndex = 0;
  questionMessage: string;
  autocompleteValue = "";
  options: SelectOptions<T>;
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

    return this.choices.filter(
      (choice) => !isSeparator(choice) && this.#filterChoice(choice, autocompleteValue, isCaseSensitive)
    );
  }

  #filterChoice(
    choice: Choice<T> | string,
    autocompleteValue: string,
    isCaseSensitive = false
  ) {
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

  #isChoiceDisabled(choice: Choice<T> | T): boolean {
    return typeof choice !== "string" && Boolean(choice.disabled);
  }

  #findNextEnabledIndex(from: number, direction: 1 | -1): number {
    const total = this.filteredChoices.length;
    if (total === 0) {
      return from;
    }

    let index = (from + direction + total) % total;

    while (index !== from) {
      const choice = this.filteredChoices[index];
      if (!isSeparator(choice) && !this.#isChoiceDisabled(choice)) {
        return index;
      }
      index = (index + direction + total) % total;
    }

    return from;
  }

  #findFirstEnabledIndex(): number {
    const index = this.filteredChoices.findIndex(
      (choice) => !isSeparator(choice) && !this.#isChoiceDisabled(choice as Choice<T> | T)
    );

    return index === -1 ? 0 : index;
  }

  get longestChoice() {
    const selectableChoices = this.filteredChoices.filter(
      (choice): choice is Choice<T> | T => !isSeparator(choice)
    );
    if (selectableChoices.length === 0) {
      return 0;
    }

    return Math.max(...selectableChoices.map((choice) => {
      if (typeof choice === "string") {
        return choice.length;
      }

      return choice.label.length;
    }));
  }

  constructor(options: SelectOptions<T>) {
    const {
      choices,
      validators = [],
      ...baseOptions
    } = options;

    super({ ...baseOptions });

    this.options = options;

    if (!choices?.length) {
      this.destroy();
      throw new TypeError("Missing required param: choices");
    }

    this.#validators = validators;

    for (const choice of choices) {
      if (typeof choice === "string" || isSeparator(choice)) {
        continue;
      }

      for (const prop of kRequiredChoiceProperties) {
        if (!choice[prop]) {
          this.destroy();
          throw new TypeError(`Missing ${prop} for choice ${JSON.stringify(choice)}`);
        }
      }
    }

    const firstSelectableIndex = choices.findIndex((choice) => !isSeparator(choice));
    if (firstSelectableIndex === -1) {
      this.destroy();
      throw new TypeError("choices must contain at least one non-separator item");
    }
    this.activeIndex = this.#findFirstEnabledIndex();
  }

  #getFormattedChoice(choiceIndex: number) {
    const choice = this.filteredChoices[choiceIndex] as Choice<T> | T;

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
      const rawChoice = this.filteredChoices[choiceIndex];

      if (isSeparator(rawChoice)) {
        const separatorLabel = rawChoice.label ? `  ${rawChoice.label}  ` : "";
        // eslint-disable-next-line @stylistic/max-len
        this.write(`  ${styleText("gray", `${SYMBOLS.SeparatorLine}${SYMBOLS.SeparatorLine}${separatorLabel}${SYMBOLS.SeparatorLine}${SYMBOLS.SeparatorLine}`)}${EOL}`);
        continue;
      }

      const formattedChoice = this.#getFormattedChoice(choiceIndex);
      const isChoiceSelected = choiceIndex === this.activeIndex;
      const isChoiceDisabled = this.#isChoiceDisabled(rawChoice);
      const showPreviousChoicesArrow = startIndex > 0 && choiceIndex === startIndex;
      const showNextChoicesArrow = endIndex < this.filteredChoices.length && choiceIndex === endIndex - 1;

      let prefixArrow = " ";
      if (showPreviousChoicesArrow) {
        prefixArrow = SYMBOLS.Previous;
      }
      else if (showNextChoicesArrow) {
        prefixArrow = SYMBOLS.Next;
      }

      const prefix = isChoiceDisabled
        ? `${prefixArrow}  `
        : `${prefixArrow}${isChoiceSelected ? `${SYMBOLS.Pointer} ` : "  "}`;
      const formattedLabel = formattedChoice.label.padEnd(
        this.longestChoice < 10 ? this.longestChoice : 0
      );
      const formattedDescription = formattedChoice.description ? ` - ${formattedChoice.description}` : "";
      const disabledMessage = isChoiceDisabled && typeof rawChoice !== "string" && typeof rawChoice.disabled === "string"
        ? ` [${rawChoice.disabled}]`
        : "";

      let textStyles: InspectColor[];
      if (isChoiceDisabled) {
        textStyles = ["gray", "dim"];
      }
      else if (isChoiceSelected) {
        textStyles = ["white", "bold"];
      }
      else {
        textStyles = ["gray"];
      }

      const str = `${prefix}${styleText(textStyles, `${formattedLabel}${formattedDescription}${disabledMessage}`)}${EOL}`;

      this.write(str);
    }
  }

  async #handleReturn(resolve: (value: T) => void, render: (options: RenderOptions) => void) {
    const activeChoice: Choice<T> | T | Separator | undefined = this.filteredChoices[this.activeIndex];
    if (isSeparator(activeChoice)) {
      return;
    }
    if (activeChoice !== void 0 && this.#isChoiceDisabled(activeChoice)) {
      return;
    }

    this.#isValidating = true;

    try {
      // When autocomplete produces no results, activeChoice is undefined — fall back to empty string
      const choice = activeChoice ?? ("" as T);
      const label = typeof choice === "string" ? choice : choice.label;
      const value = typeof choice === "string" ? choice : choice.value;

      for (const validator of this.#validators) {
        let validationResult: ValidationResponse;
        const result = validator.validate(value as string);

        if (result instanceof Promise) {
          let dotCount = 1;

          render({ validating: `validating${".".repeat(dotCount)}` });

          const spinnerInterval = setInterval(() => {
            dotCount = (dotCount % 3) + 1;
            render({ validating: `validating${".".repeat(dotCount)}` });
          }, VALIDATION_SPINNER_INTERVAL);

          try {
            validationResult = await result;
          }
          finally {
            clearInterval(spinnerInterval);
          }
        }
        else {
          validationResult = result;
        }

        if (isValid(validationResult) === false) {
          render({ error: resultError(validationResult) });

          return;
        }
      }

      render({ clearRender: true });

      if (!this.options.ignoreValues?.includes(value as T)) {
        this.#showAnsweredQuestion(label);
      }

      this.write(SYMBOLS.ShowCursor);
      this.destroy();

      this.#onProcessExit();
      process.off("exit", this.#boundExitEvent);

      resolve(value as T);
    }
    finally {
      this.#isValidating = false;
    }
  }

  #showAnsweredQuestion(label: string) {
    const symbolPrefix = label === "" ? SYMBOLS.Cross : SYMBOLS.Tick;
    const prefix = `${symbolPrefix} ${styleText("bold", this.message)} ${SYMBOLS.Pointer}`;
    const formattedChoice = styleText("yellow", label);

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
    if (this.#isValidating) {
      return;
    }
    if (key.name === "up") {
      this.activeIndex = this.#findNextEnabledIndex(this.activeIndex, -1);
      render();
    }
    else if (key.name === "down") {
      this.activeIndex = this.#findNextEnabledIndex(this.activeIndex, 1);
      render();
    }
    else if (key.name === "return") {
      void this.#handleReturn(resolve, render);
    }
    else {
      if (!key.ctrl && this.options.autocomplete) {
        // reset selected choices when user type
        this.activeIndex = this.#findFirstEnabledIndex();
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

  async listen(): Promise<T> {
    if (this.skip) {
      this.destroy();
      const firstSelectable = this.filteredChoices.find((choice) => !isSeparator(choice)) as Choice<T> | T | undefined;

      return (typeof firstSelectable === "string" ? firstSelectable : firstSelectable?.value ?? "") as T;
    }

    const answer = this.agent.nextAnswers.shift();
    if (answer !== undefined) {
      this.#showAnsweredQuestion(answer);
      this.destroy();

      return answer;
    }

    this.transformer = () => null;
    this.write(SYMBOLS.HideCursor);
    this.#showQuestion();

    const render = (
      options: RenderOptions = {}
    ) => {
      const {
        initialRender = false,
        clearRender = false,
        error = null,
        validating = null
      } = options;

      if (!initialRender) {
        let linesToClear = this.lastRender.endIndex - this.lastRender.startIndex;
        while (linesToClear > 0) {
          this.clearLastLine();
          linesToClear--;
        }
        if (this.options.autocomplete) {
          let linesToClear = Math.ceil(
            stringLength(`${SYMBOLS.Pointer} ${this.autocompleteValue}`) / this.stdout.columns
          );
          while (linesToClear > 0) {
            this.clearLastLine();
            linesToClear--;
          }
        }
      }

      if (clearRender) {
        this.clearLastLine();

        return;
      }

      if (error || validating) {
        this.clearLastLine();
        this.#showQuestion(error, validating);
      }

      this.#showChoices();
    };

    render({ initialRender: true });

    this.#boundExitEvent = this.#onProcessExit.bind(this);
    process.once("exit", this.#boundExitEvent);

    const { resolve, promise } = Promise.withResolvers<T>();
    this.#boundKeyPressEvent = this.#onKeypress.bind(this, resolve, render);
    this.stdin.on("keypress", this.#boundKeyPressEvent);

    return promise;
  }

  #showQuestion(error: string | null = null, validating: string | null = null) {
    let hint = "";
    if (validating) {
      hint = styleText("yellow", `[${validating}]`);
    }
    else if (error) {
      hint += `${hint.length > 0 ? " " : ""}${styleText(["red", "bold"], `[${error}]`)}`;
    }

    this.questionMessage = `${SYMBOLS.QuestionMark} ${styleText("bold", this.message)}${hint.length > 0 ? ` ${hint}` : ""}`;

    this.write(`${this.questionMessage}${EOL}`);
  }
}
