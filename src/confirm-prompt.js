// Import Node.js Dependencies
import { EOL } from "node:os";

// Import Third-party Dependencies
import ansi from "ansi-styles";

// Import Internal Dependencies
import { AbstractPrompt } from "./abstract-prompt.js";
import { SYMBOLS } from "./constants.js";

const kDefaultConfirmOptions = { initial: false };

export class ConfirmPrompt extends AbstractPrompt {
  // eslint-disable-next-line max-params
  constructor(message, options = {}, stdin = process.stdin, stdout = process.stdout) {
    super(message, stdin, stdout);

    const { initial } = { ...kDefaultConfirmOptions, ...options };
    const Yes = `${ansi.bold.open}Yes${ansi.bold.close}`;
    const No = `${ansi.bold.open}No${ansi.bold.close}`;
    const tip = initial ? `${Yes}/no` : `yes/${No}`;

    this.initial = initial;
  }

  #question() {
    return new Promise((resolve) => {
      const label = `${ansi.bold.open}${SYMBOLS.QuestionMark} ${this.message}${ansi.bold.close}`;
      const question = `${label} ${ansi.grey.open}(${this.initial ? "Yes/no" : "yes/No"})${ansi.grey.close} `;
      this.rl.question(question,
        (answer) => {
          this.history.push(question + answer);
          resolve(answer);
        }
      );
    });
  }

  #onQuestionAnswer() {
    this.clearLastLine();
    this.write(`${this.answer ? SYMBOLS.Tick : SYMBOLS.Cross} ${this.message}${EOL}`);
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
