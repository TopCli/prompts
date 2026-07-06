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
import { AbortError } from "./errors/abort.ts";

function onceError(
  emitter: NodeJS.EventEmitter,
  signal: AbortSignal
): Promise<AbortError> {
  return once(emitter, "error", { signal }).then(([error]) => error);
}

export async function question<T = string>(
  message: string,
  options: Omit<QuestionOptions<T>, "message"> = {}
): Promise<T> {
  using prompt = new QuestionPrompt<T>(
    { ...options, message }
  );

  const onErrorSignal = new AbortController();
  const onError = onceError(prompt, onErrorSignal.signal);
  const result = await Promise.race([
    prompt.listen(),
    onError
  ]);
  if (result instanceof AbortError) {
    throw result;
  }
  onErrorSignal.abort();

  return result;
}

export async function select<T extends string>(
  message: string,
  options: Omit<SelectOptions<T>, "message">
): Promise<T> {
  using prompt = new SelectPrompt<T>(
    { ...options, message }
  );

  const onErrorSignal = new AbortController();
  const onError = onceError(prompt, onErrorSignal.signal);
  const result = await Promise.race([
    prompt.listen(),
    onError
  ]);
  if (result instanceof AbortError) {
    throw result;
  }
  onErrorSignal.abort();

  return result;
}

export async function confirm(
  message: string,
  options: Omit<ConfirmOptions, "message"> = {}
): Promise<boolean> {
  using prompt = new ConfirmPrompt(
    { ...options, message }
  );

  const onErrorSignal = new AbortController();
  const onError = onceError(prompt, onErrorSignal.signal);
  const result = await Promise.race([
    prompt.listen(),
    onError
  ]);
  if (result instanceof AbortError) {
    throw result;
  }
  onErrorSignal.abort();

  return result;
}

export async function multiselect<T extends string>(
  message: string,
  options: Omit<MultiselectOptions<T>, "message">
): Promise<T[]> {
  using prompt = new MultiselectPrompt<T>(
    { ...options, message }
  );

  const onErrorSignal = new AbortController();
  const onError = onceError(prompt, onErrorSignal.signal);
  const result = await Promise.race([
    prompt.listen(),
    onError
  ]);
  if (result instanceof AbortError) {
    throw result;
  }
  onErrorSignal.abort();

  return result;
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
