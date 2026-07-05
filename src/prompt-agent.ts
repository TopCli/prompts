export class PromptAgent<T = string> {
  /**
   * The prompts answers queue.
   * When not empty, any prompt will be answered by the first answer in this list.
   */
  nextAnswers: T[] = [];

  static #sharedInstance: PromptAgent<any>;
  static shared<T>() {
    this.#sharedInstance ??= new PromptAgent<T>();

    return this.#sharedInstance;
  }

  /**
   * Programmatically set the next answer for any prompt (`question()`, `confirm()`, `select()`)
   *
   * This is useful for testing.
   *
   * @example
   * ```js
   * const promptAgent = PromptAgent.shared();
   * promptAgent.nextAnswer("toto");
   *
   * const input = await question("what is your name?");
   * assert.equal(input, "toto");
   * ```
   */
  nextAnswer(
    value: T | T[]
  ) {
    if (Array.isArray(value)) {
      this.nextAnswers.push(...value);
    }
    else {
      this.nextAnswers.push(value);
    }
  }

  clear() {
    this.nextAnswers = [];
  }
}
