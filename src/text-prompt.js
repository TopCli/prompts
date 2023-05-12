// Import Node.js Dependencies
import { EOL } from "node:os";

// Import Third-party Dependencies
import ansi from "ansi-styles";
import stripAnsi from "strip-ansi";

// Import Internal Dependencies
import { AbstractPrompt } from "./abstract-prompt.js";
import { SYMBOLS } from "./constants.js";

export class TextPrompt extends AbstractPrompt {
  #validators;

  constructor(message, options = {}) {
    const { stdin = process.stdin, stdout = process.stdout, validators = [] } = options;
    super(message, stdin, stdout);

    this.#validators = validators;
    this.questionPrefix = `${ansi.bold.open}${SYMBOLS.QuestionMark} `;
    this.questionSuffix = `${ansi.bold.close} `;
    this.questionSuffixError = "";
  }

  #question() {
    return new Promise((resolve) => {
      const questionQuery = this.#getQuestionQuery();

      this.rl.question(questionQuery, (answer) => {
        this.history.push(questionQuery + answer);

        resolve(answer);
      });
    });
  }

  #getQuestionQuery() {
    return `${this.questionPrefix}${this.message}${this.questionSuffix}${this.questionSuffixError}`;
  }

  #setQuestionSuffixError(error) {
    const suffix = `${ansi.red.open}[${error}]${ansi.red.close} `;
    this.questionSuffixError = suffix;
  }

  #writeAnswer() {
    const prefix = `${ansi.bold.open}${this.answer ? SYMBOLS.Tick : SYMBOLS.Cross}`;
    const suffix = `${ansi.yellow.close}${ansi.bold.close}${EOL}`;

    this.write(`${prefix} ${this.message} ${SYMBOLS.Pointer} ${ansi.yellow.open}${this.answer ?? ""}${suffix}`);
  }

  #onQuestionAnswer() {
    this.clearLastLine();

    for (const validator of this.#validators) {
      if (!validator.validate(this.answer)) {
        const error = validator.error(this.answer);
        this.#setQuestionSuffixError(error);
        this.answer = this.#question();

        return;
      }
    }

    this.#writeAnswer();
  }

  async question() {
    this.answer = await this.#question();

    this.#onQuestionAnswer();

    while (this.answer?.constructor.name === "Promise") {
      this.answer = await this.answer;
      this.#onQuestionAnswer();
    }

    this.destroy();

    return this.answer;
  }
}
