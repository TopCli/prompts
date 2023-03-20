// Import Node.js Dependencies
import assert from 'node:assert'
import { describe, it } from 'node:test'

// Import Internal Dependencies
import { ConfirmPrompt } from '../src/confirm-prompt.js'
import { TestingPrompt } from './helpers/testing-prompt.js'

describe('ConfirmPrompt', () => {
  it('message should be required', async () => {
    assert.throws(() => new ConfirmPrompt(12), { name: 'TypeError', message: 'message must be string, number given.' })
  })

  it('should return initial, which is equal false by default', async () => {
    const logs = []
    const confirmPrompt = await TestingPrompt.ConfirmPrompt('Foo', undefined, (log) => logs.push(log))
    const input = await confirmPrompt.confirm()

    assert.deepEqual(input, false)
    assert.deepEqual(logs, [
      '? Foo  (yes/No)',
      '✖ Foo'
    ])
  })

  it('should return true given input "y"', async () => {
    const logs = []
    const confirmPrompt = await TestingPrompt.ConfirmPrompt('Foo', 'y', (log) => logs.push(log))
    const input = await confirmPrompt.confirm()

    assert.deepEqual(input, true)
    assert.deepEqual(logs, [
      '? Foo  (yes/No)',
      '✔ Foo'
    ])
  })

  it('should return true given input "yes"', async () => {
    const logs = []
    const confirmPrompt = await TestingPrompt.ConfirmPrompt('Foo', 'yes', (log) => logs.push(log))
    const input = await confirmPrompt.confirm()

    assert.deepEqual(input, true)
    assert.deepEqual(logs, [
      '? Foo  (yes/No)',
      '✔ Foo'
    ])
  })

  it('should return false given input "n"', async () => {
    const logs = []
    const confirmPrompt = await TestingPrompt.ConfirmPrompt('Foo', 'n', (log) => logs.push(log))
    const input = await confirmPrompt.confirm()

    assert.deepEqual(input, false)
    assert.deepEqual(logs, [
      '? Foo  (yes/No)',
      '✖ Foo'
    ])
  })

  it('should return false given input "no"', async () => {
    const logs = []
    const confirmPrompt = await TestingPrompt.ConfirmPrompt('Foo', 'n', (log) => logs.push(log))
    const input = await confirmPrompt.confirm()

    assert.deepEqual(input, false)
    assert.deepEqual(logs, [
      '? Foo  (yes/No)',
      '✖ Foo'
    ])
  })

  it('input should not be case sensitive', async () => {
    const logs = []
    const confirmPrompt = await TestingPrompt.ConfirmPrompt('Foo', 'yEs', (log) => logs.push(log))
    const input = await confirmPrompt.confirm()

    assert.deepEqual(input, true)
    assert.deepEqual(logs, [
      '? Foo  (yes/No)',
      '✔ Foo'
    ])
  })

  it('should return initial when input is not "y"/"yes"/"n"/"no"', async () => {
    const logs = []
    const confirmPrompt = await TestingPrompt.ConfirmPrompt('Foo', 'bar', (log) => logs.push(log), true)
    const input = await confirmPrompt.confirm()

    assert.deepEqual(input, true)
    assert.deepEqual(logs, [
      '? Foo  (Yes/no)',
      '✔ Foo'
    ])
  })
})
