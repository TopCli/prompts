// Import Internal Dependencies
import { ConfirmPrompt } from "./src/confirm-prompt.js";
import { SelectPrompt } from "./src/select-prompt.js";
import { QuestionPrompt } from "./src/question-prompt.js";
import { required } from "./src/validators.js";

export async function question(message, options = {}) {
  const questionPrompt = new QuestionPrompt(message, options);

  return questionPrompt.question();
}

export async function select(message, options) {
  const selectPrompt = new SelectPrompt(message, options);

  return selectPrompt.select();
}

export async function confirm(message, options) {
  const confirmPrompt = new ConfirmPrompt(message, options);

  return confirmPrompt.confirm();
}

export { required };
