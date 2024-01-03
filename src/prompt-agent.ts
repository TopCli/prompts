// CONSTANTS
const kPrivateInstancier = Symbol("instancier");

export class PromptAgent<T = string> {
  /**
   * The prompts answers queue.
   * When not empty, any prompt will be answered by the first answer in this list.
   */
  nextAnswers: T[] = [];

  /**
   * The shared PromptAgent.
   */
  static #this: PromptAgent;

  static agent<T>() {
    // eslint-disable-next-line no-return-assign
    return (this.#this as PromptAgent<T>) ??= new PromptAgent<T>(kPrivateInstancier);
  }

  constructor(instancier: symbol) {
    if (instancier !== kPrivateInstancier) {
      throw new Error("Cannot instanciate PromptAgent, use PromptAgent.agent() instead");
    }
  }

  /**
   * Programmatically set the next answer for any prompt (`question()`, `confirm()`, `select()`)
   *
   * This is useful for testing.
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
  nextAnswer(value: T) {
    if (Array.isArray(value)) {
      this.nextAnswers.push(...value);

      return;
    }

    this.nextAnswers.push(value);
  }
}
