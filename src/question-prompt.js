// Import Node.js Dependencies
import { EOL } from "node:os";

// Import Third-party Dependencies
import kleur from "kleur";

// Import Internal Dependencies
import { AbstractPrompt } from "./abstract-prompt.js";
import { SYMBOLS } from "./constants.js";

export class QuestionPrompt extends AbstractPrompt {
  #validators;

  constructor(message, options = {}) {
    const { stdin = process.stdin, stdout = process.stdout, validators = [] } = options;
    super(message, stdin, stdout);

    this.#validators = validators;
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
    return `${kleur.bold(`${SYMBOLS.QuestionMark} ${this.message}`)} ${this.questionSuffixError}`;
  }

  #setQuestionSuffixError(error) {
    const suffix = kleur.red(`[${error}] `);
    this.questionSuffixError = suffix;
  }

  #writeAnswer() {
    const prefix = this.answer ? SYMBOLS.Tick : SYMBOLS.Cross;
    const answer = kleur.yellow(this.answer ?? "");

    this.write(`${prefix} ${kleur.bold(this.message)} ${SYMBOLS.Pointer} ${answer}${EOL}`);
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
