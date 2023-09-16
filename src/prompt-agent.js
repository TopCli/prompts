// CONSTANTS
const kPrivateInstancier = Symbol("instancier");

export class PromptAgent {
  /**
   * The prompts answers queue.
   * When not empty, any prompt will be answered by the first answer in this list.
   *
   *  @type {string[]}
   */
  nextAnswers = [];

  /**
   * The shared PromptAgent.
   *
   * @type {PromptAgent}
   */
  static #this;

  static agent() {
    // eslint-disable-next-line no-return-assign
    return this.#this ??= new PromptAgent(kPrivateInstancier);
  }

  constructor(instancier) {
    if (instancier !== kPrivateInstancier) {
      throw new Error("Cannot instanciate PromptAgent, use PromptAgent.agent() instead");
    }
  }

  /**
   * Programmatically set the next answer for any prompt (`question()`, `confirm()`, `select()`)
   *
   * This is useful for testing.
   *
   * @param {string | boolean | Array<string | boolean>} value
   *
   * @example
   * ```js
   * const promptAgent = PromptAgent.agent();
   * promptAgent.nextAnswer("toto");
   *
   * const input = await question("what is your name?");
   * assert.equal(input, "toto");
   * ```
   */
  nextAnswer(value) {
    if (Array.isArray(value)) {
      this.nextAnswers.push(...value);

      return;
    }

    this.nextAnswers.push(value);
  }
}
