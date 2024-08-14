export type ValidResponseObject = {
  isValid?: true;
};
export type InvalidResponseObject = {
  isValid: false;
  error: string;
};
export type ValidationResponseObject = ValidResponseObject | InvalidResponseObject;
export type ValidationResponse = InvalidResponse | ValidResponse;
export type InvalidResponse = string | InvalidResponseObject;
export type ValidResponse = null | undefined | true | ValidResponseObject;

export interface PromptValidator<T = string | string[] | boolean> {
  validate: (input: T) => ValidationResponse;
}

export function required<T = string | string[] | boolean>(): PromptValidator<T> {
  return {
    validate: (input) => {
      const isValid = (Array.isArray(input) ? input.length > 0 : Boolean(input));

      return isValid ? null : { isValid, error: "required" };
    }
  };
}

export function isValid(result: ValidationResponse): result is ValidResponse {
  if (typeof result === "object") {
    return result?.isValid !== false;
  }

  if (typeof result === "string") {
    return result.length > 0;
  }

  return true;
}

export function resultError(result: InvalidResponse) {
  if (typeof result === "object") {
    return result.error;
  }

  return result;
}
