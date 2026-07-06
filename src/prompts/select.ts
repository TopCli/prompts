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
import { ChoiceVO } from "../choice-vo.ts";
import { ChoiceList } from "../choice-list.ts";

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
  #choiceList: ChoiceList<T>;
  activeIndex = 0;
  questionMessage: string;
  autocompleteValue = "";
  options: SelectOptions<T>;
  lastRender: { startIndex: number; endIndex: number; };

  get #currentChoiceList(): ChoiceList<T> {
    if (!(this.options.autocomplete && this.autocompleteValue.length > 0)) {
      return this.#choiceList;
    }

    return this.#choiceList.filtered(this.autocompleteValue, this.options.caseSensitive);
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

    try {
      this.#choiceList = ChoiceList.from(choices);
    }
    catch (error) {
      this.destroy();
      throw error;
    }

    this.activeIndex = this.#choiceList.firstEnabledIndex();
  }

  #showChoices() {
    const currentChoiceList = this.#currentChoiceList;
    const { startIndex, endIndex } = currentChoiceList.visibleRange(
      this.activeIndex,
      this.options.maxVisible || 8
    );
    this.lastRender = { startIndex, endIndex };

    if (this.options.autocomplete) {
      this.write(`${SYMBOLS.Pointer} ${this.autocompleteValue}${EOL}`);
    }
    for (let choiceIndex = startIndex; choiceIndex < endIndex; choiceIndex++) {
      const item = currentChoiceList.at(choiceIndex)!;

      if (isSeparator(item)) {
        const separatorLabel = item.label ? `  ${item.label}  ` : "";
        // eslint-disable-next-line @stylistic/max-len
        this.write(`  ${styleText("gray", `${SYMBOLS.SeparatorLine}${SYMBOLS.SeparatorLine}${separatorLabel}${SYMBOLS.SeparatorLine}${SYMBOLS.SeparatorLine}`)}${EOL}`);
        continue;
      }

      const isChoiceSelected = choiceIndex === this.activeIndex;
      const showPreviousChoicesArrow = startIndex > 0 && choiceIndex === startIndex;
      const showNextChoicesArrow = endIndex < currentChoiceList.length && choiceIndex === endIndex - 1;

      let prefixArrow = " ";
      if (showPreviousChoicesArrow) {
        prefixArrow = SYMBOLS.Previous;
      }
      else if (showNextChoicesArrow) {
        prefixArrow = SYMBOLS.Next;
      }

      const prefix = item.disabled
        ? `${prefixArrow}  `
        : `${prefixArrow}${isChoiceSelected ? `${SYMBOLS.Pointer} ` : "  "}`;
      const formattedLabel = item.label.padEnd(
        currentChoiceList.longestLabelLength < 10 ? currentChoiceList.longestLabelLength : 0
      );

      let textStyles: InspectColor[];
      if (item.disabled) {
        textStyles = ["gray", "dim"];
      }
      else if (isChoiceSelected) {
        textStyles = ["white", "bold"];
      }
      else {
        textStyles = ["gray"];
      }

      const str = `${prefix}${styleText(textStyles, `${formattedLabel}${item.descriptionSuffix}${item.disabledHint}`)}${EOL}`;

      this.write(str);
    }
  }

  async #handleReturn(
    resolve: (value: T) => void,
    render: (options: RenderOptions) => void
  ) {
    const activeChoice = this.#currentChoiceList.at(this.activeIndex);
    if (isSeparator(activeChoice)) {
      return;
    }
    if (activeChoice !== undefined && activeChoice.disabled) {
      return;
    }

    this.#isValidating = true;

    try {
      // When autocomplete produces no results, activeChoice is undefined — fall back to empty string
      const choice = activeChoice ?? new ChoiceVO<T>("" as T);
      const { label, value } = choice;

      for (const validator of this.#validators) {
        let validationResult: ValidationResponse;
        const result = validator.validate(value);

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

      if (!this.options.ignoreValues?.includes(value)) {
        this.#showAnsweredQuestion(label);
      }

      this.write(SYMBOLS.ShowCursor);

      this.#onProcessExit();
      process.off("exit", this.#boundExitEvent);

      resolve(value);
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

  #onKeypress(
    ...args
  ) {
    const [resolve, render, , key] = args;
    if (this.#isValidating) {
      return;
    }
    if (key.name === "up") {
      this.activeIndex = this.#currentChoiceList.nextEnabledIndex(this.activeIndex, -1);
      render();
    }
    else if (key.name === "down") {
      this.activeIndex = this.#currentChoiceList.nextEnabledIndex(this.activeIndex, 1);
      render();
    }
    else if (key.name === "return") {
      void this.#handleReturn(resolve, render);
    }
    else {
      if (!key.ctrl && this.options.autocomplete) {
        // reset selected choices when user type
        this.activeIndex = this.#currentChoiceList.firstEnabledIndex();
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
      // constructor guarantees at least one non-separator choice, and autocomplete
      // can't have filtered anything out yet since no keypress has been handled
      const firstSelectable = [...this.#choiceList].find(
        (item): item is ChoiceVO<T> => !isSeparator(item)
      )!;

      return firstSelectable.value;
    }

    const answer = this.agent.nextAnswers.shift();
    if (answer !== undefined) {
      this.#showAnsweredQuestion(answer);

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

  #showQuestion(
    error: string | null = null,
    validating: string | null = null
  ) {
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
