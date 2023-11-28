export interface SharedOptions {
  stdin?: NodeJS.ReadStream & {
    fd: 0;
  };
  stdout?: NodeJS.WriteStream & {
    fd: 1;
  };
}

export interface Validator {
  validate: (input: string) => boolean;
  error: (input?: string) => string;
}

export interface QuestionOptions extends SharedOptions {
  defaultValue?: string;
  validators?: Validator[];
  secure?: boolean;
}

export interface Choice {
  value: any;
  label: string;
  description?: string;
}

export interface SelectOptions extends SharedOptions  {
  choices: (Choice | string)[];
  maxVisible?: number;
  ignoreValues?: (string | number | boolean)[];
}

export interface MultiselectOptions extends SharedOptions  {
  choices: (Choice | string)[];
  maxVisible?: number;
  preSelectedChoices?: (Choice | string)[];
  validators?: Validator[];
  autocomplete?: boolean;
}

export interface ConfirmOptions extends SharedOptions  {
  initial?: boolean;
}

export function question(message: string, options?: QuestionOptions): Promise<string>;
export function select(message: string, options: SelectOptions): Promise<string>;
export function multiselect(message: string, options: MultiselectOptions): Promise<string[]>;
export function confirm(message: string, options?: ConfirmOptions): Promise<boolean>;

export function required(): Validator;

export class PromptAgent {
  /**
   * The prompts answers queue.
   * When not empty, any prompt will be answered by the first answer in this list.
   */
  nextAnswers: Array<string | boolean>;

  static get agent(): PromptAgent;

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
  nextAnswer(value: string | boolean | Array<string | boolean>): void
}
