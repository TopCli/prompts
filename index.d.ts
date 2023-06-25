export interface PromptOptions {
  validators?: Validator[];
}

export interface Validator {
  validate: (input: string) => boolean;
  error: (input?: string) => string;
}

export interface Choice {
  value: any;
  label: string;
  description?: string;
}

export interface SelectOptions {
  choices: (Choice | string)[];
  maxVisible?: number;
  ignoreValues?: (string | number | boolean)[];
}

export interface ConfirmOptions {
  initial?: boolean;
}

export function question(message: string, options?: PromptOptions): Promise<string>;
export function select(message: string, options: SelectOptions): Promise<string>;
export function confirm(message: string, options?: ConfirmOptions): Promise<boolean>;

export function required(): Validator;
