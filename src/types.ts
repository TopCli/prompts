export interface Choice<T extends string> {
  value: T;
  label: string;
  description?: string;
}
