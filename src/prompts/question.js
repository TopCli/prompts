// Import Node.js Dependencies
import { EOL } from "node:os";

// Import Third-party Dependencies
import kleur from "kleur";
import wcwidth from "@topcli/wcwidth";

// Import Internal Dependencies
import { AbstractPrompt } from "./abstract.js";
import { stripAnsi } from "../utils.js";
import { SYMBOLS } from "../constants.js";

export class QuestionPrompt extends AbstractPrompt {
  #validators;
  #secure;

  constructor(message, options = {}) {
    const {
      stdin = process.stdin,
      stdout = process.stdout,
      defaultValue,
      validators = [],
      secure = false
    } = options;

    super(message, stdin, stdout);

    if (defaultValue && typeof defaultValue !== "string") {
      throw new TypeError("defaultValue must be a string");
    }

    this.defaultValue = defaultValue;
    this.tip = this.defaultValue ? ` (${this.defaultValue})` : "";
    this.#validators = validators;
    this.#secure = Boolean(secure);
    this.questionSuffixError = "";
  }

  #question() {
    return new Promise((resolve) => {
      const questionQuery = this.#getQuestionQuery();

      this.rl.question(questionQuery, (answer) => {
        this.history.push(questionQuery + answer);
        this.mute = false;

        resolve(answer);
      });
      this.mute = this.#secure;
    });
  }

  #getQuestionQuery() {
    return `${kleur.bold(`${SYMBOLS.QuestionMark} ${this.message}${this.tip}`)} ${this.questionSuffixError}`;
  }

  #setQuestionSuffixError(error) {
    const suffix = kleur.red(`[${error}] `);
    this.questionSuffixError = suffix;
  }

  #writeAnswer() {
    const prefix = this.answer ? SYMBOLS.Tick : SYMBOLS.Cross;
    const answer = kleur.yellow(this.#secure ? "CONFIDENTIAL" : this.answer ?? "");
    this.write(`${prefix} ${kleur.bold(this.message)} ${SYMBOLS.Pointer} ${answer}${EOL}`);
  }

  #onQuestionAnswer() {
    const questionLineCount = Math.ceil(
      wcwidth(stripAnsi(this.#getQuestionQuery() + this.answer)) / this.stdout.columns
    );

    this.stdout.moveCursor(-this.stdout.columns, -questionLineCount);
    this.stdout.clearScreenDown();

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
    if (this.agent.nextAnswers.length > 0) {
      this.answer = this.agent.nextAnswers.shift();
      this.#writeAnswer();
      this.destroy();

      return this.answer;
    }

    this.answer = await this.#question();

    if (this.answer === "" && this.defaultValue) {
      this.answer = this.defaultValue;
    }

    this.#onQuestionAnswer();

    while (this.answer?.constructor.name === "Promise") {
      this.answer = await this.answer;
      this.#onQuestionAnswer();
    }

    this.destroy();

    return this.answer;
  }
}
