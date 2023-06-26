// Import Node.js Dependencies
import { EOL } from "node:os";

// Import Third-party Dependencies
import kleur from "kleur";

// Import Internal Dependencies
import { AbstractPrompt } from "./abstract-prompt.js";
import { SYMBOLS } from "./constants.js";

export class ConfirmPrompt extends AbstractPrompt {
  constructor(message, options = {}) {
    const {
      stdin = process.stdin,
      stdout = process.stdout,
      initial = false
    } = options;
    super(message, stdin, stdout);

    const Yes = kleur.bold("Yes");
    const No = kleur.bold("No");
    this.tip = kleur.gray(initial ? `(${Yes}/no)` : `(yes/${No})`);

    this.initial = initial;
  }

  #question() {
    return new Promise((resolve) => {
      const questionQuery = this.#getQuestionQuery();

      this.rl.question(questionQuery,
        (answer) => {
          this.history.push(questionQuery + answer);

          resolve(answer);
        }
      );
    });
  }

  #getQuestionQuery() {
    const query = kleur.bold(`${SYMBOLS.QuestionMark} ${this.message}`);

    return `${query} ${this.tip} `;
  }

  #onQuestionAnswer() {
    this.clearLastLine();
    this.write(`${this.answer ? SYMBOLS.Tick : SYMBOLS.Cross} ${kleur.bold(this.message)}${EOL}`);
  }

  #validateResult(result) {
    if (typeof result !== "string") {
      return false;
    }

    return ["y", "yes", "no", "n"].includes(result.toLowerCase());
  }

  async confirm() {
    try {
      const result = await this.#question();
      this.answer = this.#validateResult(result) ? ["y", "yes"].includes(result.toLocaleLowerCase()) : this.initial;
      this.#onQuestionAnswer();

      return this.answer;
    }
    finally {
      this.destroy();
    }
  }
}
