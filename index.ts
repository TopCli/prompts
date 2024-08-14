// Import Internal Dependencies
import * as prompts from "./src/prompts/index.js";
import { required, type PromptValidator } from "./src/validators.js";
import { PromptAgent } from "./src/prompt-agent.js";
import type { AbstractPromptOptions } from "./src/prompts/abstract.js";
import type { Choice } from "./src/types.js";
import type { QuestionOptions } from "./src/prompts/question.js";
import type { ConfirmOptions } from "./src/prompts/confirm.js";
import type { MultiselectOptions } from "./src/prompts/multiselect.js";
import type { SelectOptions } from "./src/prompts/select.js";

export async function question(message: string, options: Omit<QuestionOptions, "message"> = {}) {
  return new prompts.QuestionPrompt({ ...options, message }).question();
}

export async function select(message: string, options: Omit<SelectOptions, "message">) {
  const selectPrompt = new prompts.SelectPrompt({ ...options, message });

  return selectPrompt.select();
}

export async function confirm(message: string, options: Omit<ConfirmOptions, "message"> = {}) {
  const confirmPrompt = new prompts.ConfirmPrompt({ ...options, message });

  return confirmPrompt.confirm();
}

export async function multiselect(message: string, options: Omit<MultiselectOptions, "message">) {
  const multiselectPrompt = new prompts.MultiselectPrompt({ ...options, message });

  return multiselectPrompt.multiselect();
}

export type {
  PromptValidator,
  AbstractPromptOptions,
  QuestionOptions,
  ConfirmOptions,
  Choice,
  MultiselectOptions,
  SelectOptions
};

export {
  required,
  PromptAgent
};
