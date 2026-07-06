// Import Node.js Dependencies
import { EOL } from "node:os";
import { styleText, type InspectColor } from "node:util";

// Import Internal Dependencies
import { AbstractPrompt, type AbstractPromptOptions } from "./abstract.ts";
import { stringLength, isSeparator } from "../utils.ts";
import { SYMBOLS, VALIDATION_SPINNER_INTERVAL } from "../constants.ts";
import { isValid, type PromptValidator, resultError, type ValidationResponse } from "../validators.ts";
import type { Choice, Separator } from "../types.ts";
import { ChoiceVO } from "../choice-vo.ts";
import { ChoiceList } from "../choice-list.ts";

export interface MultiselectOptions<
  T extends string
> extends AbstractPromptOptions {
  choices: (Choice<T> | T | Separator)[];
  maxVisible?: number;
  preSelectedChoices?: (Choice<T> | T)[];
  validators?: PromptValidator<string[]>[];
  autocomplete?: boolean;
  caseSensitive?: boolean;
  showHint?: boolean;
}

type VoidFn = () => void;
type RenderOptions = {
  initialRender?: boolean;
  clearRender?: boolean;
  error?: string;
  validating?: string;
};

export class MultiselectPrompt<
  T extends string
> extends AbstractPrompt<T> {
  #boundExitEvent: VoidFn = () => void 0;
  #boundKeyPressEvent: VoidFn = () => void 0;
  #validators: PromptValidator<string[]>[];
  #showHint: boolean;
  #isValidating = false;
  #choiceList: ChoiceList<T>;

  activeIndex = 0;
  selectedIndexes: Set<number> = new Set();
  questionMessage: string;
  autocompleteValue = "";
  options: MultiselectOptions<T>;
  lastRender: { startIndex: number; endIndex: number; };

  get #currentChoiceList(): ChoiceList<T> {
    if (!(this.options.autocomplete && this.autocompleteValue.length > 0)) {
      return this.#choiceList;
    }

    return this.#choiceList.filtered(this.autocompleteValue, this.options.caseSensitive);
  }

  constructor(
    options: MultiselectOptions<T>
  ) {
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

    try {
      this.#choiceList = ChoiceList.from(choices);
    }
    catch (error) {
      this.destroy();
      throw error;
    }

    this.activeIndex = this.#choiceList.firstEnabledIndex();

    for (const choice of preSelectedChoices) {
      const value = typeof choice === "string" ? choice : choice.value;
      const choiceIndex = this.#choiceList.indexOf(value);

      if (choiceIndex === -1) {
        this.destroy();
        throw new Error(`Invalid pre-selected choice: ${value}`);
      }

      const preSelectedChoice = this.#choiceList.at(choiceIndex) as ChoiceVO<T>;
      if (preSelectedChoice.disabled) {
        this.destroy();
        throw new Error(`Cannot pre-select a disabled choice: ${value}`);
      }

      this.selectedIndexes.add(choiceIndex);
    }
  }

  #showChoices() {
    const currentChoiceList = this.#currentChoiceList;
    const { startIndex, endIndex } = currentChoiceList.visibleRange(this.activeIndex, this.options.maxVisible || 8);
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

      const isChoiceActive = choiceIndex === this.activeIndex;
      const isChoiceSelected = this.selectedIndexes.has(choiceIndex);
      const showPreviousChoicesArrow = startIndex > 0 && choiceIndex === startIndex;
      const showNextChoicesArrow = endIndex < currentChoiceList.length && choiceIndex === endIndex - 1;

      let prefixArrow = "  ";
      if (showPreviousChoicesArrow) {
        prefixArrow = SYMBOLS.Previous + " ";
      }
      else if (showNextChoicesArrow) {
        prefixArrow = SYMBOLS.Next + " ";
      }

      const prefix = `${prefixArrow}${isChoiceSelected ? SYMBOLS.Active : SYMBOLS.Inactive}`;
      const formattedLabel = item.label.padEnd(
        currentChoiceList.longestLabelLength < 10 ? currentChoiceList.longestLabelLength : 0
      );

      let textStyles: InspectColor[];
      if (item.disabled) {
        textStyles = ["gray", "dim"];
      }
      else if (isChoiceActive) {
        textStyles = ["white", "bold"];
      }
      else {
        textStyles = ["gray"];
      }

      const str = `${prefix} ${styleText(textStyles, `${formattedLabel}${item.descriptionSuffix}${item.disabledHint}`)}${EOL}`;

      this.write(str);
    }
  }

  async #handleReturn(
    resolve: (values: T[]) => void,
    render: (options?: RenderOptions) => void
  ) {
    this.#isValidating = true;

    try {
      const { values, labels } = this.#selectedChoices();

      for (const validator of this.#validators) {
        let validationResult: ValidationResponse;
        const result = validator.validate(values);

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

      this.#showAnsweredQuestion(labels.join(", "));

      this.write(SYMBOLS.ShowCursor);

      this.#onProcessExit();
      process.off("exit", this.#boundExitEvent);

      resolve(values);
    }
    finally {
      this.#isValidating = false;
    }
  }

  #showAnsweredQuestion(
    choices: string,
    isAgentAnswer = false
  ) {
    const prefixSymbol = this.selectedIndexes.size === 0 && !isAgentAnswer ? SYMBOLS.Cross : SYMBOLS.Tick;
    const prefix = `${prefixSymbol} ${styleText("bold", this.message)} ${SYMBOLS.Pointer}`;
    const formattedChoice = styleText("yellow", choices);

    this.write(`${prefix}${choices ? ` ${formattedChoice}` : ""}${EOL}`);
  }

  #selectedChoices() {
    const currentChoiceList = this.#currentChoiceList;

    return [...this.selectedIndexes].reduce<{ values: T[]; labels: string[]; }>(
      (acc, index) => {
        const item = currentChoiceList.at(index);

        if (item !== undefined && !isSeparator(item)) {
          acc.values.push(item.value);
          acc.labels.push(item.label);
        }

        return acc;
      },
      {
        values: [],
        labels: []
      }
    );
  }

  #onProcessExit() {
    this.stdin.off("keypress", this.#boundKeyPressEvent);
    this.stdout.moveCursor(-this.stdout.columns, 0);
    this.stdout.clearScreenDown();
    this.write(SYMBOLS.ShowCursor);
  }

  #onKeypress(...args: any[]) {
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
    else if (key.ctrl && key.name === "a") {
      const enabledIndexes = [...this.#currentChoiceList].flatMap((item, index) => {
        if (isSeparator(item) || item.disabled) {
          return [];
        }

        return [index];
      });
      this.selectedIndexes = this.selectedIndexes.size === enabledIndexes.length ?
        new Set() :
        new Set(enabledIndexes);
      render();
    }
    else if (key.name === "right") {
      const activeChoice = this.#currentChoiceList.at(this.activeIndex);
      if (activeChoice !== undefined && !isSeparator(activeChoice) && !activeChoice.disabled) {
        this.selectedIndexes.add(this.activeIndex);
        render();
      }
    }
    else if (key.name === "left") {
      const activeChoice = this.#currentChoiceList.at(this.activeIndex);
      if (activeChoice !== undefined && !isSeparator(activeChoice) && !activeChoice.disabled) {
        this.selectedIndexes = new Set([...this.selectedIndexes].filter((index) => index !== this.activeIndex));
        render();
      }
    }
    else if (key.name === "return") {
      void this.#handleReturn(resolve, render);
    }
    else {
      if (!key.ctrl && this.options.autocomplete) {
        // reset selected choices when user type
        this.selectedIndexes.clear();
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

  async listen(): Promise<T[]> {
    if (this.skip) {
      const { values } = this.#selectedChoices();

      return values;
    }

    const answer = this.agent.nextAnswers.shift();
    if (answer !== undefined) {
      const formatedAnser = Array.isArray(answer) ? answer.join(", ") : answer;
      this.#showAnsweredQuestion(formatedAnser, true);

      return Array.isArray(answer) ? answer : [answer];
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

    const { promise, resolve } = Promise.withResolvers<T[]>();
    this.#boundKeyPressEvent = this.#onKeypress.bind(this, resolve, render);
    this.stdin.on("keypress", this.#boundKeyPressEvent);

    return promise;
  }

  #showQuestion(
    error: string | null = null,
    validating: string | null = null
  ) {
    let hint = this.#showHint ? styleText("gray",
      // eslint-disable-next-line @stylistic/max-len
      `(Press ${styleText("bold", "<Ctrl+A>")} to toggle all, ${styleText("bold", "<Left/Right>")} to toggle, ${styleText("bold", "<Return>")} to submit)`
    ) : "";
    if (validating) {
      hint += `${hint.length > 0 ? " " : ""}${styleText("yellow", `[${validating}]`)}`;
    }
    else if (error) {
      hint += `${hint.length > 0 ? " " : ""}${styleText(["red", "bold"], `[${error}]`)}`;
    }

    this.questionMessage = `${SYMBOLS.QuestionMark} ${styleText("bold", this.message)}${hint.length > 0 ? ` ${hint}` : ""}`;

    this.write(`${this.questionMessage}${EOL}`);
  }
}
