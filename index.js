// Import Internal Dependencies
import { ConfirmPrompt } from './src/confirm-prompt.js'
import { SelectPrompt } from './src/select-prompt.js'
import { TextPrompt } from './src/text-prompt.js'

export async function prompt (message) {
  const textPrompt = new TextPrompt(message)

  return textPrompt.question()
}

export async function select (message, options) {
  const selectPrompt = new SelectPrompt(message, options)

  return selectPrompt.select()
}

export async function confirm (message, options) {
  const confirmPrompt = new ConfirmPrompt(message, options)

  return confirmPrompt.confirm()
}
