// Import Node.js Dependencies
import assert from 'node:assert'
import { describe, it } from 'node:test'

// Import Internal Dependencies
import { TextPrompt } from '../src/text-prompt.js'
import { TestingPrompt } from './helpers/testing-prompt.js'

describe('TextPrompt', () => {
  it('message should be required', async () => {
    assert.throws(() => new TextPrompt(12), { name: 'TypeError', message: 'message must be string, number given.' })
  })

  it('value should be OK', async () => {
    const logs = []
    const textPrompt = await TestingPrompt.TextPrompt('What\'s your name?', 'Joe', (log) => logs.push(log))
    const input = await textPrompt.question()
    assert.deepEqual(input, 'Joe')
    assert.deepEqual(logs, [
      "? What's your name?",
      "✔ What's your name? › Joe"
    ])
  })

  it('value should be KO', async () => {
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
