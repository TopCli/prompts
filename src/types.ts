export interface Choice<T extends string> {
  value: T;
  label: string;
  description?: string;
  disabled?: boolean | string;
}

export interface Separator {
  type: "separator";
  label?: string;
}

