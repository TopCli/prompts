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
      const question = `${this.questionPrefix}${this.message}${this.questionSuffix}${this.questionSuffixError}`;
      this.rl.question(question, (answer) => {
        this.history.push(question + answer);
        resolve(answer);
      });
    });
  }

  async #onQuestionAnswer() {
    this.clearLastLine();

    for (const validator of this.#validators) {
      if (!validator.validate(this.answer)) {
        this.questionSuffixError = `${ansi.red.open}[${validator.error(this.answer)}]${ansi.red.close}${ansi.bold.close} `;
        this.answer = this.#question();

        return;
      }
    }

    const prefix = `${ansi.bold.open}${this.answer ? SYMBOLS.Tick : SYMBOLS.Cross}`;
    const suffix = `${ansi.yellow.close}${ansi.bold.close}${EOL}`;
    this.write(`${prefix} ${this.message} ${SYMBOLS.Pointer} ${ansi.yellow.open}${this.answer ?? ""}${suffix}`);
  }

  async question() {
    this.answer = await this.#question();

    await this.#onQuestionAnswer();

    while (this.answer?.constructor.name === "Promise") {
      this.answer = await this.answer;
      await this.#onQuestionAnswer();
    }

    this.destroy();

    return this.answer;
  }
}
