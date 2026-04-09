// Import Node.js Dependencies
import { once } from "node:events";

// Import Internal Dependencies
import {
  required,
  type PromptValidator,
  type PromptTransformer,
  type ValidResponseObject,
  type InvalidResponseObject,
  type ValidationResponseObject,
  type ValidationResponse,
  type InvalidResponse,
  type ValidResponse,
  type ValidTransformationResponse,
  type TransformationResponse
} from "./validators.ts";
import { PromptAgent } from "./prompt-agent.ts";
import { number, integer, url } from "./transformers.ts";
import type { Choice, Separator } from "./types.ts";

import {
  QuestionPrompt,
  ConfirmPrompt,
  SelectPrompt,
  MultiselectPrompt,

  type AbstractPromptOptions,
  type SelectOptions,
  type QuestionOptions,
  type ConfirmOptions,
  type MultiselectOptions
} from "./prompts/index.ts";
import type { AbortError } from "./errors/abort.ts";

export async function question<T = string>(
  message: string,
  options: Omit<QuestionOptions<T>, "message"> = {}
): Promise<T> {
  const prompt = new QuestionPrompt<T>(
    { ...options, message }
  );

  const onErrorSignal = new AbortController();
  const onError = once(
    prompt, "error", { signal: onErrorSignal.signal }
  ) as Promise<[AbortError]>;
  const result = await Promise.race([
    prompt.listen(),
    onError
  ]);
  if (isAbortError(result)) {
    prompt.destroy();

    throw result[0];
  }
  onErrorSignal.abort();

  return result as T;
}

export async function select<T extends string>(
  message: string,
  options: Omit<SelectOptions<T>, "message">
): Promise<T> {
  const prompt = new SelectPrompt<T>(
    { ...options, message }
  );

  const onErrorSignal = new AbortController();
  const onError = once(
    prompt, "error", { signal: onErrorSignal.signal }
  ) as Promise<[AbortError]>;
  const result = await Promise.race([
    prompt.listen(),
    onError
  ]);
  if (isAbortError(result)) {
    prompt.destroy();

    throw result[0];
  }
  onErrorSignal.abort();

  return result;
}

export async function confirm(
  message: string,
  options: Omit<ConfirmOptions, "message"> = {}
): Promise<boolean> {
  const prompt = new ConfirmPrompt(
    { ...options, message }
  );

  const onErrorSignal = new AbortController();
  const onError = once(
    prompt, "error", { signal: onErrorSignal.signal }
  ) as Promise<[AbortError]>;
  const result = await Promise.race([
    prompt.listen(),
    onError
  ]);
  if (isAbortError(result)) {
    prompt.destroy();

    throw result[0];
  }
  onErrorSignal.abort();

  return result;
}

export async function multiselect<T extends string>(
  message: string,
  options: Omit<MultiselectOptions<T>, "message">
): Promise<T[]> {
  const prompt = new MultiselectPrompt<T>(
    { ...options, message }
  );

  const onErrorSignal = new AbortController();
  const onError = once(
    prompt, "error", { signal: onErrorSignal.signal }
  ) as Promise<[AbortError]>;
  const result = await Promise.race([
    prompt.listen(),
    onError
  ]);
  if (isAbortError(result)) {
    prompt.destroy();

    throw result[0];
  }
  onErrorSignal.abort();

  return result;
}

function isAbortError(
  error: unknown
): error is [AbortError] {
  return Array.isArray(error) && error.length > 0 && error[0] instanceof Error;
}

export type {
  PromptValidator,
  PromptTransformer,
  AbstractPromptOptions,
  QuestionOptions,
  ConfirmOptions,
  Choice,
  Separator,
  MultiselectOptions,
  SelectOptions,
  ValidResponseObject,
  InvalidResponseObject,
  ValidationResponseObject,
  ValidationResponse,
  InvalidResponse,
  ValidResponse,
  ValidTransformationResponse,
  TransformationResponse
};

export const validators = { required };
export const transformers = { number, integer, url };

export { PromptAgent };
