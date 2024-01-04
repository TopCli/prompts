export interface SharedOptions {
  stdin?: NodeJS.ReadStream & {
    fd: 0;
  };
  stdout?: NodeJS.WriteStream & {
    fd: 1;
  };
}

export interface Choice<T = any> {
  value: T;
  label: string;
  description?: string;
}
