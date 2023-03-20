// Import Node.js Dependencies
import { EOL } from 'node:os'

// Import Third-party Dependencies
import ansi from 'ansi-styles'

// Import Internal Dependencies
import { AbstractPrompt } from './abstract-prompt.js'
import { SYMBOLS } from './constants.js'

export class TextPrompt extends AbstractPrompt {
  #question

  constructor (message, stdin = process.stdin, stdout = process.stdout) {
    super(message, stdin, stdout)

    this.#question = new Promise((resolve) => {
      this.rl.question(`${ansi.bold.open}${SYMBOLS.QuestionMark} ${message}${ansi.bold.close} `, (answer) => {
        resolve(answer)
      })
    })
  }

  #onQuestionAnswer () {
    this.clearLastLine()
    this.stdout.write(`${ansi.bold.open}${this.answer ? SYMBOLS.Tick : SYMBOLS.Cross} ${this.message} ${SYMBOLS.Pointer} ${ansi.yellow.open}${this.answer ?? ''}${ansi.yellow.close}${ansi.bold.close}${EOL}`)
  }

  async question () {
    try {
      this.answer = await this.#question

      this.#onQuestionAnswer()

      return this.answer
    } finally {
      this.destroy()
    }
  }
}
