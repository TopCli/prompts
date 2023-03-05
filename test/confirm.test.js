import { confirm } from '../index.js'

import { describe, it } from 'node:test'
import assert from 'node:assert'

describe('confirm', () => {
  it('message should be required', async () => {
    await assert.rejects(confirm(), { name: 'TypeError', message: 'message must be a string' })
  })
})
