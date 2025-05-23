// Import Node.js Dependencies
import { EOL } from "node:os";
import { styleText } from "node:util";

// Import Internal Dependencies
import { AbstractPrompt, type AbstractPromptOptions } from "./abstract.js";
import { stringLength } from "../utils.js";
import { SYMBOLS } from "../constants.js";
import { isValid, type PromptValidator, resultError } from "../validators.js";

export interface QuestionOptions extends AbstractPromptOptions {
  defaultValue?: string;
  validators?: PromptValidator[];
  secure?: boolean;
}

export class QuestionPrompt extends AbstractPrompt<string> {
  defaultValue?: string;
  tip: string;
  questionSuffixError: string;
  answer?: string;
  answerBuffer?: Promise<string>;
  #validators: PromptValidator[];
  #secure: boolean;

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
    this.#secure = Boolean(secure);
    this.questionSuffixError = "";
  }

  #question(): Promise<string> {
    return new Promise((resolve) => {
      const questionQuery = this.#getQuestionQuery();

      this.history.push(questionQuery);
      this.rl.question(questionQuery, (answer) => {
        this.history.push(questionQuery + answer);
        this.mute = false;

        resolve(answer);
      });
      this.mute = this.#secure;
    });
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
    const answer = styleText("yellow", this.#secure ? "CONFIDENTIAL" : this.answer ?? "");
    this.write(`${prefix} ${styleText("bold", this.message)} ${SYMBOLS.Pointer} ${answer}${EOL}`);
  }

  #onQuestionAnswer() {
    const questionLineCount = Math.ceil(
      stringLength(this.#getQuestionQuery() + this.answer) / this.stdout.columns
    );

    this.stdout.moveCursor(-this.stdout.columns, -questionLineCount);
    this.stdout.clearScreenDown();

    for (const validator of this.#validators) {
      const validationResult = validator.validate(this.answer!);

      if (isValid(validationResult) === false) {
        this.#setQuestionSuffixError(resultError(validationResult));
        this.answerBuffer = this.#question();

        return;
      }
    }

    this.answerBuffer = void 0;
    this.#writeAnswer();
  }

  async question(): Promise<string> {
    if (this.skip) {
      this.destroy();

      return this.defaultValue ?? "";
    }

    // eslint-disable-next-line no-async-promise-executor
    return new Promise(async(resolve, reject) => {
      this.answer = this.agent.nextAnswers.shift();
      if (this.answer !== undefined) {
        this.#writeAnswer();
        this.destroy();

        resolve(this.answer);

        return;
      }

      this.once("error", (error) => {
        reject(error);
      });

      this.answer = await this.#question();

      if (this.answer === "" && this.defaultValue) {
        this.answer = this.defaultValue;
      }

      this.#onQuestionAnswer();

      while (this.answerBuffer !== undefined) {
        this.answer = await this.answerBuffer;
        this.#onQuestionAnswer();
      }

      this.destroy();

      resolve(this.answer);
    });
  }
}
