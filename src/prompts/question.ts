// Import Node.js Dependencies
import { EOL } from "node:os";
import { styleText } from "node:util";

// Import Internal Dependencies
import { AbstractPrompt, type AbstractPromptOptions } from "./abstract.ts";
import { stringLength } from "../utils.ts";
import { SYMBOLS, VALIDATION_SPINNER_INTERVAL } from "../constants.ts";
import { isValid, type PromptValidator, type ValidationResponse, resultError } from "../validators.ts";

export interface QuestionOptions extends AbstractPromptOptions {
  defaultValue?: string;
  validators?: PromptValidator<string>[];
  secure?: boolean | {
    placeholder: string;
  };
}

export class QuestionPrompt extends AbstractPrompt<string> {
  defaultValue?: string;
  tip: string;
  questionSuffixError: string;
  answer?: string;
  answerBuffer?: Promise<string>;
  #validators: PromptValidator<string>[];
  #secure: boolean;
  #securePlaceholder: string | null = null;

  constructor(options: QuestionOptions) {
    const {
      defaultValue,
      validators = [],
      secure = false,
      ...baseOptions
    } = options;

    super({ ...baseOptions });

    if (defaultValue && typeof defaultValue !== "string") {
      throw new TypeError("defaultValue must be a string");
    }

    this.defaultValue = defaultValue;
    this.tip = this.defaultValue ? ` (${this.defaultValue})` : "";
    this.#validators = validators;

    if (typeof secure === "object") {
      this.#secure = true;
      this.#securePlaceholder = secure.placeholder;
    }
    else {
      this.#secure = Boolean(secure);
    }
    this.questionSuffixError = "";
  }

  #question(): Promise<string> {
    const { resolve, promise } = Promise.withResolvers<string>();

    const questionQuery = this.#getQuestionQuery();

    this.history.push(questionQuery);
    this.rl.question(questionQuery, (answer) => {
      this.history.push(questionQuery + answer);
      this.reset();

      resolve(answer);
    });

    if (this.#securePlaceholder !== null) {
      this.transformer = (input) => Buffer.from(this.#securePlaceholder!.repeat(input.length), "utf-8");
    }

    return promise;
  }

  #getQuestionQuery() {
    return `${styleText("bold", `${SYMBOLS.QuestionMark} ${this.message}${this.tip}`)} ${this.questionSuffixError}`;
  }

  #setQuestionSuffixError(error: string) {
    const suffix = styleText("red", `[${error}] `);
    this.questionSuffixError = suffix;
  }

  #writeAnswer() {
    const prefix = this.answer ? SYMBOLS.Tick : SYMBOLS.Cross;
    const answer = this.answer ?? "";
    const maskedAnswer = this.#securePlaceholder ?
      this.#securePlaceholder.repeat(answer.length) :
      answer;

    const stylizedAnswer = styleText(
      "yellow",
      this.#secure && this.#securePlaceholder === null ?
        "CONFIDENTIAL" : maskedAnswer
    );
    this.write(`${prefix} ${styleText("bold", this.message)} ${SYMBOLS.Pointer} ${stylizedAnswer}${EOL}`);
  }

  #getValidatingQuery(dotCount: number) {
    const question = styleText("bold", `${SYMBOLS.QuestionMark} ${this.message}${this.tip}`);
    const hint = styleText("yellow", `[validating${".".repeat(dotCount)}]`);

    return `${question} ${hint}${EOL}`;
  }

  async #onQuestionAnswer() {
    const questionLineCount = Math.ceil(
      stringLength(this.#getQuestionQuery() + this.answer) / this.stdout.columns
    );

    this.stdout.moveCursor(-this.stdout.columns, -questionLineCount);
    this.stdout.clearScreenDown();

    for (const validator of this.#validators) {
      let validationResult: ValidationResponse;
      const result = validator.validate(this.answer!);

      if (result instanceof Promise) {
        let dotCount = 1;

        this.write(this.#getValidatingQuery(dotCount));

        const spinnerInterval = setInterval(() => {
          dotCount = (dotCount % 3) + 1;
          this.clearLastLine();
          this.write(this.#getValidatingQuery(dotCount));
        }, VALIDATION_SPINNER_INTERVAL);

        try {
          validationResult = await result;
        }
        finally {
          clearInterval(spinnerInterval);
          this.clearLastLine();
        }
      }
      else {
        validationResult = result;
      }

      if (isValid(validationResult) === false) {
        this.#setQuestionSuffixError(resultError(validationResult));
        this.answerBuffer = this.#question();

        return;
      }
    }

    this.answerBuffer = void 0;
    this.#writeAnswer();
  }

  async listen(): Promise<string> {
    if (this.skip) {
      this.destroy();

      return this.defaultValue ?? "";
    }

    this.answer = this.agent.nextAnswers.shift();
    if (this.answer !== undefined) {
      this.#writeAnswer();
      this.destroy();

      return this.answer;
    }

    this.answer = await this.#question();

    if (this.answer === "" && this.defaultValue) {
      this.answer = this.defaultValue;
    }

    await this.#onQuestionAnswer();

    while (this.answerBuffer !== undefined) {
      this.answer = await this.answerBuffer;
      await this.#onQuestionAnswer();
    }

    this.destroy();

    return this.answer;
  }
}
