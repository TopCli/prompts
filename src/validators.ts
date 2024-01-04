export interface PromptValidator<T = string | string[] | boolean> {
  validate: (input: T) => boolean;
  error: (input: T) => string;
}

export function required<T = string | string[] | boolean>(): PromptValidator<T> {
  return {
    validate: (input) => (Array.isArray(input) ? input.length > 0 : Boolean(input)),
    error: () => "required"
  };
}
