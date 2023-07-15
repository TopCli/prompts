// Import Node.js Dependencies
import { EOL } from "node:os";

// Import Third-party Dependencies
import kleur from "kleur";

// Import Internal Dependencies
import { AbstractPrompt } from "./abstract-prompt.js";
import { SYMBOLS } from "./constants.js";

// CONSTANTS
const kToggleKeys = new Set([
  "left",
  "right",
  "tab",
  "q",
  "a",
  "d",
  "h",
  "j",
  "k",
  "l",
  "space"
]);

export class ConfirmPrompt extends AbstractPrompt {
  #boundKeyPressEvent;
  #boundExitEvent;

  constructor(message, options = {}) {
    const {
      stdin = process.stdin,
      stdout = process.stdout,
      initial = false
    } = options;
    super(message, stdin, stdout);

    this.initial = initial;
    this.selectedValue = initial;
  }

  #getHint() {
    const Yes = kleur.bold().underline().cyan("Yes");
    const No = kleur.bold().underline().cyan("No");

    return this.selectedValue ? `${Yes} no` : `yes ${No}`;
  }

  #render() {
    this.write(this.#getQuestionQuery());
  }

  #question() {
    return new Promise((resolve) => {
      const questionQuery = this.#getQuestionQuery();

      this.write(questionQuery);

      this.#boundKeyPressEvent = this.#onKeypress.bind(this, resolve);
      this.stdin.on("keypress", this.#boundKeyPressEvent);

      this.#boundExitEvent = this.#onProcessExit.bind(this);
      process.once("exit", this.#boundExitEvent);
    });
  }

  #onKeypress(resolve, value, key) {
    this.stdin.pause();
    this.stdout.moveCursor(-this.#getQuestionQuery().length, 0);
    this.stdout.clearScreenDown(() => this.stdin.resume());

    if (key.name === "return") {
      resolve(this.selectedValue);

      return;
    }

    if (kToggleKeys.has(key.name)) {
      this.selectedValue = !this.selectedValue;
    }

    this.#render();
  }

  #onProcessExit() {
    this.stdin.off("keypress", this.#boundKeyPressEvent);
  }

  #getQuestionQuery() {
    const query = kleur.bold(`${SYMBOLS.QuestionMark} ${this.message}`);

    return `${query} ${this.#getHint()}`;
  }

  #onQuestionAnswer() {
    this.clearLastLine();
    this.write(`${this.selectedValue ? SYMBOLS.Tick : SYMBOLS.Cross} ${kleur.bold(this.message)}${EOL}`);
  }

  async confirm() {
    this.write(SYMBOLS.HideCursor);

    try {
      await this.#question();
      this.#onQuestionAnswer();

      return this.selectedValue;
    }
    finally {
      this.write(SYMBOLS.ShowCursor);

      this.#onProcessExit();
      process.off("exit", this.#boundExitEvent);

      this.destroy();
    }
  }
}
