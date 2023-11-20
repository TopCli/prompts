// Import Internal Dependencies
import * as prompts from "./src/prompts/index.js";
import { required } from "./src/validators.js";
import { PromptAgent } from "./src/prompt-agent.js";

export async function question(message, options = {}) {
  const questionPrompt = new prompts.QuestionPrompt(message, options);

  return questionPrompt.question();
}

export async function select(message, options) {
  const selectPrompt = new prompts.SelectPrompt(message, options);

  return selectPrompt.select();
}

export async function confirm(message, options) {
  const confirmPrompt = new prompts.ConfirmPrompt(message, options);

  return confirmPrompt.confirm();
}

export async function multiselect(message, options) {
  const multiselectPrompt = new prompts.MultiselectPrompt(message, options);

  return multiselectPrompt.multiselect();
}

export { required, PromptAgent };
