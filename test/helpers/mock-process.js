// Import Node.js Dependencies
import { EOL } from 'node:os'

// Import Third-party Dependencies
import stripAnsi from 'strip-ansi'

export function mockProcess (inputs, writeCb) {
  const stdout = {
    write: (msg) => {
      const noAnsiMsg = stripAnsi(msg)
      if (noAnsiMsg) {
        writeCb(noAnsiMsg.replace(EOL, ''))
      }
    },
    moveCursor: () => {},
    clearScreenDown: () => {},
    clearLine: () => {}
  }
  const stdin = {
    on: (event, cb) => {
      for (const input of inputs) {
        cb(null, input)
      }
    },
    off: () => {}
  }

  return { stdout, stdin }
}
