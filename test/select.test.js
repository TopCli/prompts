import { select } from '../index.js'

import stripAnsi from 'strip-ansi'

import { describe, it } from 'node:test'
import assert from 'node:assert'
import { EOL } from 'node:os'

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

  it('When press <return>, it should select the first choice.', async () => {
    const logs = []
    const mockStdout = {
      write: (msg) => {
        const noAnsiMsg = stripAnsi(msg)
        if (noAnsiMsg) {
          logs.push(noAnsiMsg)
        }
      },
      moveCursor: () => {},
      clearScreenDown: () => {},
      clearLine: () => {}
    }
    const mockStdin = {
      on: (event, cb) => cb(null, { name: 'return' }),
      off: () => {}
    }

    await select('foo', { choices: ['choice1', 'choice2'], stdout: mockStdout, stdin: mockStdin })

    assert.deepEqual(logs, [`? foo${EOL}`, ` › choice1${EOL}`, `   choice2${EOL}`, `✔ foo › choice1${EOL}`])
  })

  it('When press <down> then <return>, it should select the second choice.', async () => {
    const logs = []
    const mockInputs = [
      { name: 'down' },
      { name: 'return' }
    ]
    const mockStdout = {
      write: (msg) => {
        const noAnsiMsg = stripAnsi(msg)
        if (noAnsiMsg) {
          logs.push(noAnsiMsg)
        }
      },
      moveCursor: () => {},
      clearScreenDown: () => {},
      clearLine: () => {}
    }
    const mockStdin = {
      on: (event, cb) => {
        cb(null, mockInputs.shift())
        cb(null, mockInputs.shift())
      },
      off: () => {}
    }

    const value = await select('foo', { choices: ['choice1', 'choice2'], stdout: mockStdout, stdin: mockStdin })

    assert.deepEqual(logs, [
      `? foo${EOL}`,
      ` › choice1${EOL}`,
      `   choice2${EOL}`,
      `   choice1${EOL}`,
      ` › choice2${EOL}`,
      `✔ foo › choice2${EOL}`
    ])
    assert.deepEqual(value, 'choice2')
  })

  it('It should work with choice objects.', async () => {
    const logs = []
    const mockStdout = {
      write: (msg) => {
        const noAnsiMsg = stripAnsi(msg)
        if (noAnsiMsg) {
          logs.push(noAnsiMsg)
        }
      },
      moveCursor: () => {},
      clearScreenDown: () => {},
      clearLine: () => {}
    }
    const mockStdin = {
      on: (event, cb) => cb(null, { name: 'return' }),
      off: () => {}
    }

    await select('foo', {
      choices: [
        { value: 'choice1', label: 'choice1' },
        { value: 'choice2', label: 'choice2' }
      ],
      stdout: mockStdout,
      stdin: mockStdin
    })

    assert.deepEqual(logs, [`? foo${EOL}`, ` › choice1${EOL}`, `   choice2${EOL}`, `✔ foo › choice1${EOL}`])
  })

  it('When the first item is selected and the up arrow is pressed, the last item should be selected.', async () => {
    const logs = []
    const mockInputs = [
      { name: 'down' },
      { name: 'return' }
    ]
    const mockStdout = {
      write: (msg) => {
        const noAnsiMsg = stripAnsi(msg)
        if (noAnsiMsg) {
          logs.push(noAnsiMsg)
        }
      },
      moveCursor: () => {},
      clearScreenDown: () => {},
      clearLine: () => {}
    }
    const mockStdin = {
      on: (event, cb) => {
        cb(null, mockInputs.shift())
        cb(null, mockInputs.shift())
      },
      off: () => {}
    }

    const value = await select('foo', { choices: ['choice1', 'choice2'], stdout: mockStdout, stdin: mockStdin })

    assert.deepEqual(logs, [
      `? foo${EOL}`,
      ` › choice1${EOL}`,
      `   choice2${EOL}`,
      `   choice1${EOL}`,
      ` › choice2${EOL}`,
      `✔ foo › choice2${EOL}`
    ])
    assert.deepEqual(value, 'choice2')
  })

  it('When the last item is selected and the down arrow is pressed, the first item should be selected.', async () => {
    const logs = []
    const mockInputs = [
      { name: 'down' },
      { name: 'down' },
      { name: 'return' }
    ]
    const mockStdout = {
      write: (msg) => {
        const noAnsiMsg = stripAnsi(msg)
        if (noAnsiMsg) {
          logs.push(noAnsiMsg)
        }
      },
      moveCursor: () => {},
      clearScreenDown: () => {},
      clearLine: () => {}
    }
    const mockStdin = {
      on: (event, cb) => {
        cb(null, mockInputs.shift())
        cb(null, mockInputs.shift())
        cb(null, mockInputs.shift())
      },
      off: () => {}
    }

    const value = await select('foo', { choices: ['choice1', 'choice2'], stdout: mockStdout, stdin: mockStdin })

    assert.deepEqual(logs, [
      `? foo${EOL}`,
      ` › choice1${EOL}`,
      `   choice2${EOL}`,
      `   choice1${EOL}`,
      ` › choice2${EOL}`,
      ` › choice1${EOL}`,
      `   choice2${EOL}`,
      `✔ foo › choice1${EOL}`
    ])
    assert.deepEqual(value, 'choice1')
  })

  it('should ignore choice1', async () => {
    const logs = []
    const mockStdout = {
      write: (msg) => {
        const noAnsiMsg = stripAnsi(msg)
        if (noAnsiMsg) {
          logs.push(noAnsiMsg)
        }
      },
      moveCursor: () => {},
      clearScreenDown: () => {},
      clearLine: () => {}
    }
    const mockStdin = {
      on: (event, cb) => cb(null, { name: 'return' }),
      off: () => {}
    }

    await select('foo', { choices: ['choice1', 'choice2'], ignoreValues: ['choice1'], stdout: mockStdout, stdin: mockStdin })

    assert.deepEqual(logs, [
      `? foo${EOL}`,
      ` › choice1${EOL}`,
      `   choice2${EOL}`
      // '✔ foo › choice1']
    ])
  })
})
