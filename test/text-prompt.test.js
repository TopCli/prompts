// Import Node.js Dependencies
import assert from 'node:assert'
import { describe, it } from 'node:test'

// Import Internal Dependencies
import { TextPrompt } from '../src/text-prompt.js'
import { TestingPrompt } from './helpers/testing-prompt.js'

describe('TextPrompt', () => {
  it('message should be string', async () => {
    assert.throws(() => new TextPrompt(12), { name: 'TypeError', message: 'message must be string, number given.' })
  })

  it('should render with tick on valid input', async () => {
    const logs = []
    const textPrompt = await TestingPrompt.TextPrompt('What\'s your name?', 'Joe', (log) => logs.push(log))
    const input = await textPrompt.question()
    assert.deepEqual(input, 'Joe')
    assert.deepEqual(logs, [
      "? What's your name?",
      "✔ What's your name? › Joe"
    ])
  })

  it('should render cross on invalid input', async () => {
    const logs = []
    const textPrompt = await TestingPrompt.TextPrompt('What\'s your name?', undefined, (log) => logs.push(log))
    const input = await textPrompt.question()
    assert.deepEqual(input, undefined)
    assert.deepEqual(logs, [
      "? What's your name?",
      "✖ What's your name? › "
    ])
  })
})
