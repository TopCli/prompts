import { prompt } from '../index.js'

import { describe, it } from 'node:test'
import assert from 'node:assert'

describe('prompt', () => {
  it('message should be required', async () => {
    await assert.rejects(prompt(12), { name: 'TypeError', message: 'message must be a string' })
  })
})
