import { select } from '../index.js'

import { describe, it } from 'node:test'
import assert from 'node:assert'

describe('select', () => {
  it('message should be required', async () => {
    await assert.rejects(select(12), { name: 'TypeError', message: 'message must be a string' })
  })

  it('choices should be required', async () => {
    await assert.rejects(select('foo'), { name: 'TypeError', message: 'Missing required options' })
  })

  it('choices should be required', async () => {
    await assert.rejects(select('foo', { foo: 'bar' }), { name: 'TypeError', message: 'Missing required param: choices' })
  })

  it('choice.label should be required', async () => {
    await assert.rejects(
      select('bar', {
        choices: [{
          description: 'foo',
          value: true
        }]
      }),
      {
        name: 'TypeError',
        message: 'Missing label for choice {"description":"foo","value":true}'
      }
    )
  })

  it('choice.value should be required', async () => {
    await assert.rejects(
      select('bar', {
        choices: [{
          label: 'foo',
          description: 'bar'
        }]
      }),
      {
        name: 'TypeError',
        message: 'Missing value for choice {"label":"foo","description":"bar"}'
      }
    )
  })
})
