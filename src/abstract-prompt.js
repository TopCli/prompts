// Import Node.js Dependencies
import { createInterface } from 'node:readline'

export class AbstractPrompt {
  constructor (message, input = process.stdin, output = process.stdout) {
    if (this.constructor === AbstractPrompt) {
      throw new Error("AbstractPrompt can't be instantiated.")
    }

    if (typeof message !== 'string') {
      throw new TypeError(`message must be string, ${typeof message} given.`)
    }

    this.stdin = input
    this.stdout = output
    this.message = message

    this.rl = createInterface({ input, output })
  }

  clearLastLine () {
    this.stdout.moveCursor(0, -1)
    this.stdout.clearLine()
  }

  destroy () {
    this.rl.close()
  }
}
