// Import Node.js Dependencies
import { EOL } from "node:os";
import type { Key } from "node:readline";
import { styleText } from "node:util";

// Import Internal Dependencies
import { AbstractPrompt, type AbstractPromptOptions } from "./abstract.js";
import { stringLength, withResolvers } from "../utils.js";
import { SYMBOLS } from "../constants.js";

export interface ConfirmOptions extends AbstractPromptOptions {
  initial?: boolean;
}

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

export class ConfirmPrompt extends AbstractPrompt<boolean> {
  initial: boolean;
  selectedValue: boolean;
  fastAnswer: boolean;
  #boundKeyPressEvent: (...args: any) => void;
  #boundExitEvent: (...args: any) => void;

  constructor(options: ConfirmOptions) {
    const {
      initial = false,
      ...baseOptions
    } = options;
    super({ ...baseOptions });

    this.initial = initial;
    this.selectedValue = initial;
  }

  #getHint() {
    const Yes = styleText(["cyan", "bold", "underline"], "Yes");
    const No = styleText(["cyan", "bold", "underline"], "No");

    return this.selectedValue ? `${Yes}/No` : `Yes/${No}`;
  }

  #render() {
    this.write(this.#getQuestionQuery());
  }

  #onKeypress(resolve: (value: boolean) => void, _value: any, key: Key) {
    this.stdout.moveCursor(
      -this.stdout.columns,
      -Math.floor(stringLength(this.#getQuestionQuery()) / this.stdout.columns)
    );
    this.stdout.clearScreenDown();

    if (key.name === "return") {
      resolve(this.selectedValue);

      return;
    }

    if (kToggleKeys.has(key.name ?? "")) {
      this.selectedValue = !this.selectedValue;
    }

    if (key.name === "y") {
      this.selectedValue = true;
      resolve(true);
      this.fastAnswer = true;
    }
    else if (key.name === "n") {
      this.selectedValue = false;
      resolve(false);
      this.fastAnswer = true;
    }

    if (!this.fastAnswer) {
      this.#render();
    }
  }

  #onProcessExit() {
    this.stdin.off("keypress", this.#boundKeyPressEvent);
  }

  #getQuestionQuery() {
    const query = styleText("bold", `${SYMBOLS.QuestionMark} ${this.message}`);

    return `${query} ${this.#getHint()}`;
  }

  #onQuestionAnswer() {
    this.clearLastLine();
    this.stdout.moveCursor(
      -this.stdout.columns,
      -Math.floor(stringLength(this.#getQuestionQuery()) / this.stdout.columns)
    );
    this.stdout.clearScreenDown();
    this.write(`${this.selectedValue ? SYMBOLS.Tick : SYMBOLS.Cross} ${styleText("bold", this.message)}${EOL}`);
  }

  async listen(): Promise<boolean> {
    if (this.skip) {
      this.destroy();

      return this.initial;
    }

    const answer = this.agent.nextAnswers.shift();
    if (answer !== undefined) {
      this.selectedValue = answer;
      this.#onQuestionAnswer();
      this.destroy();

      return answer;
    }

    this.write(SYMBOLS.HideCursor);

    try {
      const { resolve, promise } = withResolvers<boolean>();
      const questionQuery = this.#getQuestionQuery();

      this.write(questionQuery);

      this.#boundKeyPressEvent = this.#onKeypress.bind(this, resolve);
      this.stdin.on("keypress", this.#boundKeyPressEvent);

      this.#boundExitEvent = this.#onProcessExit.bind(this);
      process.once("exit", this.#boundExitEvent);

      this.#onQuestionAnswer();

      return promise;
    }
    finally {
      this.write(SYMBOLS.ShowCursor);

      this.#onProcessExit();
      process.off("exit", this.#boundExitEvent);

      this.destroy();
    }
  }
}
