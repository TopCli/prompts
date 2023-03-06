export interface Choice {
  value: any,
  label: string,
  description?: string,
}
export function prompt(message: string): Promise<string>;
export function select(message: string, options: { choices: (Choice | string)[], maxVisble?: number, ignoreValues: (string | number | boolean)[] }): Promise<string>;
export function confirm(message: string, options?: { initial: boolean }): Promise<string>;
