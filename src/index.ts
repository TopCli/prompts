// Import Node.js Dependencies
import { once } from "node:events";

// Import Internal Dependencies
import {
  required,
  type PromptValidator,
  type ValidResponseObject,
  type InvalidResponseObject,
  type ValidationResponseObject,
  type ValidationResponse,
  type InvalidResponse,
  type ValidResponse
} from "./validators.js";
import { PromptAgent } from "./prompt-agent.js";
import type { Choice } from "./types.js";

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
} from "./prompts/index.js";
import type { AbortError } from "./errors/abort.js";

export async function question(
  message: string,
  options: Omit<QuestionOptions, "message"> = {}
): Promise<string> {
  const prompt = new QuestionPrompt(
    { ...options, message }
  );

  const result = await Promise.race([
    prompt.listen(),
    once(prompt, "error") as Promise<[AbortError]>
  ]);
  if (isAbortError(result)) {
    prompt.destroy();

    throw result[0];
  }

  return result;
}

export async function select<T extends string>(
  message: string,
  options: Omit<SelectOptions<T>, "message">
): Promise<T> {
  const prompt = new SelectPrompt<T>(
    { ...options, message }
  );

  const result = await Promise.race([
    prompt.listen(),
    once(prompt, "error") as Promise<[AbortError]>
  ]);
  if (isAbortError(result)) {
    prompt.destroy();

    throw result[0];
  }

  return result;
}

export async function confirm(
  message: string,
  options: Omit<ConfirmOptions, "message"> = {}
): Promise<boolean> {
  const prompt = new ConfirmPrompt(
    { ...options, message }
  );

  const result = await Promise.race([
    prompt.listen(),
    once(prompt, "error") as Promise<[AbortError]>
  ]);
  if (isAbortError(result)) {
    prompt.destroy();

    throw result[0];
  }

  return result;
}

export async function multiselect<T extends string>(
  message: string,
  options: Omit<MultiselectOptions<T>, "message">
): Promise<T[]> {
  const prompt = new MultiselectPrompt<T>(
    { ...options, message }
  );

  const result = await Promise.race([
    prompt.listen(),
    once(prompt, "error") as Promise<[AbortError]>
  ]);
  if (isAbortError(result)) {
    prompt.destroy();

    throw result[0];
  }

  return result;
}

function isAbortError(
  error: unknown
): error is [AbortError] {
  return Array.isArray(error) && error.length > 0 && error[0] instanceof Error;
}

export type {
  PromptValidator,
  AbstractPromptOptions,
  QuestionOptions,
  ConfirmOptions,
  Choice,
  MultiselectOptions,
  SelectOptions,
  ValidResponseObject,
  InvalidResponseObject,
  ValidationResponseObject,
  ValidationResponse,
  InvalidResponse,
  ValidResponse
};

export {
  required,
  PromptAgent
};
