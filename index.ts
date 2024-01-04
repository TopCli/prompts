// Import Internal Dependencies
import * as prompts from "./src/prompts/index.js";
import { required, type PromptValidator } from "./src/validators.js";
import { PromptAgent } from "./src/prompt-agent.js";
import type { SharedOptions, Choice } from "./src/types.js";
import type { QuestionOptions } from "./src/prompts/question.js";
import type { ConfirmOptions } from "./src/prompts/confirm.js";
import type { MultiselectOptions } from "./src/prompts/multiselect.js";
import type { SelectOptions } from "./src/prompts/select.js";

export async function question(message, options = {}) {
  const questionPrompt = new prompts.QuestionPrompt(message, options);

  return questionPrompt.question();
}

export async function select(message: string, options: SelectOptions) {
  const selectPrompt = new prompts.SelectPrompt(message, options);

  return selectPrompt.select();
}

export async function confirm(message: string, options: ConfirmOptions) {
  const confirmPrompt = new prompts.ConfirmPrompt(message, options);

  return confirmPrompt.confirm();
}

export async function multiselect(message: string, options: MultiselectOptions) {
  const multiselectPrompt = new prompts.MultiselectPrompt(message, options);

  return multiselectPrompt.multiselect();
}

export {
  required,
  PromptValidator,
  PromptAgent,
  SharedOptions,
  QuestionOptions,
  ConfirmOptions,
  Choice,
  MultiselectOptions,
  SelectOptions
};
