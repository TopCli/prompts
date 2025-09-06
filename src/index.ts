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

export function question(
  message: string,
  options: Omit<QuestionOptions, "message"> = {}
) {
  return new QuestionPrompt(
    { ...options, message }
  ).listen();
}

export function select<T extends string>(
  message: string,
  options: Omit<SelectOptions<T>, "message">
) {
  return new SelectPrompt<T>(
    { ...options, message }
  ).listen();
}

export function confirm(
  message: string,
  options: Omit<ConfirmOptions, "message"> = {}
) {
  return new ConfirmPrompt(
    { ...options, message }
  ).listen();
}

export function multiselect<T extends string>(
  message: string,
  options: Omit<MultiselectOptions<T>, "message">
) {
  return new MultiselectPrompt<T>(
    { ...options, message }
  ).listen();
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
