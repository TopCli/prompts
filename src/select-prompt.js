// Import Node.js Dependencies
import { EOL } from 'node:os'

// Import Third-party Dependencies
import ansi from 'ansi-styles'

// Import Internal Dependencies
import { AbstractPrompt } from './abstract-prompt.js'
import { SYMBOLS } from './constants.js'

export class SelectPrompt extends AbstractPrompt {
  activeIndex = 0

  constructor (message, options, stdin = process.stdin, stdout = process.stdout) {
    super(message, stdin, stdout)

    if (!options) {
      this.destroy()
      throw new TypeError('Missing required options')
    }

    this.options = options
    const { choices } = options

    if (!choices?.length) {
      this.destroy()
      throw new TypeError('Missing required param: choices')
    }

    this.choices = choices
    this.longestChoice = Math.max(...choices.map(choice => {
      if (typeof choice === 'string') {
        return choice.length
      }

      const kRequiredChoiceProperties = ['label', 'value']

      for (const prop of kRequiredChoiceProperties) {
        if (!choice[prop]) {
          this.destroy()
          throw new TypeError(`Missing ${prop} for choice ${JSON.stringify(choice)}`)
        }
      }

      return choice.label.length
    }))
  }

  async select () {
    this.stdout.write(SYMBOLS.HideCursor)
    this.stdout.write(`${ansi.bold.open}${SYMBOLS.QuestionMark} ${this.message}${ansi.bold.close}${EOL}`)

    let lastRender = null
    const render = (initialRender = false, { reset } = {}) => {
      const getVisibleChoices = (currentIndex, total, maxVisible) => {
        let startIndex = Math.min(total - maxVisible, currentIndex - Math.floor(maxVisible / 2))
        if (startIndex < 0) {
          startIndex = 0
        }

        const endIndex = Math.min(startIndex + maxVisible, total)

        return { startIndex, endIndex }
      }

      const { startIndex, endIndex } = getVisibleChoices(this.activeIndex, this.choices.length, this.options.maxVisible || 8)

      if (!initialRender) {
        const linesToClear = lastRender.endIndex - lastRender.startIndex
        this.stdout.moveCursor(0, -linesToClear)
        this.stdout.clearScreenDown()
      }

      if (reset) {
        this.clearLastLine(this.stdout)
        this.clearLastLine(this.stdout)

        return
      }

      lastRender = { startIndex, endIndex }

      for (let i = startIndex; i < endIndex; i++) {
        const choice = typeof this.choices[i] === 'string' ? { value: this.choices[i], label: this.choices[i] } : this.choices[i]
        const prefix = `${startIndex > 0 && i === startIndex ? SYMBOLS.Previous : endIndex < this.choices.length && i === endIndex - 1 ? SYMBOLS.Next : ' '}${i === this.activeIndex ? `${SYMBOLS.Active} ` : `${SYMBOLS.Inactive}  `}`
        const str = `${prefix}${choice.label.padEnd(this.longestChoice < 10 ? this.longestChoice : 0)}${choice.description ? ` - ${choice.description}` : ''}${ansi.reset.open}${EOL}`
        this.stdout.write(str)
      }
    }

    render(true)

    return new Promise((resolve) => {
      const onKeypress = (value, key) => {
        if (key.name === 'up') {
          this.activeIndex = this.activeIndex === 0 ? this.choices.length - 1 : this.activeIndex - 1
          render()
        } else if (key.name === 'down') {
          this.activeIndex = this.activeIndex === this.choices.length - 1 ? 0 : this.activeIndex + 1
          render()
        } else if (key.name === 'return') {
          this.stdin.off('keypress', onKeypress)

          render(false, { reset: true })

          const value = this.choices[this.activeIndex].value ?? this.choices[this.activeIndex]
          if (!this.options.ignoreValues?.includes(value)) {
            this.stdout.write(`${ansi.bold.open}${SYMBOLS.Tick} ${this.message} ${SYMBOLS.Pointer} ${ansi.yellow.open}${this.choices[this.activeIndex].label ?? this.choices[this.activeIndex]}${ansi.reset.open}${EOL}`)
          }

          this.stdout.write(SYMBOLS.ShowCursor)
          this.destroy()
          resolve(value)
        }
      }

      this.stdin.on('keypress', onKeypress)
    })
  }
}
