import { createInterface } from 'node:readline/promises'

import ansi from 'ansi-styles'

const kQuestionMark = `${ansi.blue.open}?${ansi.blue.close}`
const kTick = `${ansi.green.open}✔${ansi.green.close}`
const kCross = `${ansi.red.open}✖${ansi.red.close}`
const kPointer = `${ansi.gray.open}›${ansi.gray.close}`
const kActive = `${ansi.reset.open}${kPointer} `
const kInactive = `${ansi.gray.open}  `
const kPrevious = '⭡'
const kNext = '⭣'
const kShowCursor = '\x1B[?25h'
const kHideCursor = '\x1B[?25l'

function clearLastLine () {
  process.stdout.moveCursor(0, -1)
  process.stdout.clearLine()
}

export async function prompt (message) {
  if (typeof message !== 'string') {
    throw new TypeError('message must be a string')
  }

  const { stdin: input, stdout: output } = process
  const rl = createInterface({ input, output })

  const answer = await rl.question(`${ansi.bold.open} ${kPointer} ${message} ${ansi.bold.close}`)

  clearLastLine()
  console.log(`${ansi.bold.open}${answer ? kTick : kCross} ${message} ${kPointer} ${ansi.yellow.open}${answer}${ansi.yellow.close}${ansi.bold.close}`)

  rl.close()

  return answer
}

export async function select (message, options) {
  if (typeof message !== 'string') {
    throw new TypeError('message must be a string')
  }

  if (!options) {
    throw new TypeError('Missing required options')
  }

  const { choices } = options

  if (!choices?.length) {
    throw new TypeError('Missing required param: choices')
  }

  const longestChoice = Math.max(...choices.map(choice => {
    if (typeof choice === 'string') {
      return choice.length
    }

    const kRequiredChoiceProperties = ['label', 'value']

    for (const prop of kRequiredChoiceProperties) {
      if (!choice[prop]) {
        throw new TypeError(`Missing ${prop} for choice ${JSON.stringify(choice)}`)
      }
    }

    return choice.label.length
  }))

  process.stdout.write(kHideCursor)
  const { stdin: input, stdout: output } = process
  const rl = createInterface({ input, output })

  let activeIndex = 0

  console.log(`${ansi.bold.open}${kQuestionMark} ${message}${ansi.bold.close}`)

  let lastRender = null
  const render = (initialRender = false, { reset } = {}) => {
    const getVisibleChoices = (currentIndex, total, maxVisible) => {
      maxVisible = maxVisible || total

      let startIndex = Math.min(total - maxVisible, currentIndex - Math.floor(maxVisible / 2))
      if (startIndex < 0) {
        startIndex = 0
      }

      const endIndex = Math.min(startIndex + maxVisible, total)

      return { startIndex, endIndex }
    }

    const { startIndex, endIndex } = getVisibleChoices(activeIndex, choices.length, options.maxVisible || 8)

    if (!initialRender) {
      const linesToClear = lastRender.endIndex - lastRender.startIndex
      process.stdout.clearLine(1)
      process.stdout.moveCursor(0, -linesToClear)
      process.stdout.clearLine(1)
    }

    if (reset) {
      clearLastLine()
      clearLastLine()
      return
    }

    lastRender = { startIndex, endIndex }

    for (let i = startIndex; i < endIndex; i++) {
      const choice = typeof choices[i] === 'string' ? { value: choices[i], label: choices[i] } : choices[i]
      const prefix = `${startIndex > 0 && i === startIndex ? kPrevious : endIndex < choices.length && i === endIndex - 1 ? kNext : ' '}${i === activeIndex ? kActive : kInactive}`
      const str = `${prefix}${choice.label.padEnd(longestChoice < 10 ? longestChoice : 0)}${choice.description ? ` - ${choice.description}` : ''}${ansi.reset.open}`
      console.log(str)
    }
  }

  render(true)

  return new Promise((resolve) => {
    const onKeypress = (value, key) => {
      if (key.name === 'up') {
        activeIndex = activeIndex === 0 ? choices.length - 1 : activeIndex - 1
        render()
      } else if (key.name === 'down') {
        activeIndex = activeIndex === choices.length - 1 ? 0 : activeIndex + 1
        render()
      } else if (key.name === 'return') {
        process.stdin.off('keypress', onKeypress)
        render(false, { reset: true })

        console.log(`${ansi.bold.open}${kTick} ${message} ${kPointer} ${ansi.yellow.open}${choices[activeIndex].value}${ansi.reset.open}`)

        process.stderr.write(kShowCursor)
        rl.close()

        resolve(choices[activeIndex].value)
      }
    }

    process.stdin.on('keypress', onKeypress)
  })
}

const kDefaultConfirmOptions = { initial: false }

export async function confirm (message, options = kDefaultConfirmOptions) {
  if (typeof message !== 'string') {
    throw new TypeError('message must be a string')
  }

  const { initial } = { kDefaultConfirmOptions, ...options }

  const { stdin: input, stdout: output } = process
  const rl = createInterface({ input, output })

  const tip = initial ? `${ansi.bold.open}Yes${ansi.bold.close}/no` : `yes/${ansi.bold.open}No${ansi.bold.close}`
  const answer = await rl.question(`${kQuestionMark} ${message} ${ansi.grey.open}(${tip})${ansi.grey.close} ${kPointer} `)
  const result = (!answer && initial) || ['y', 'yes'].includes(answer.toLocaleLowerCase())

  clearLastLine()
  console.log(`${result ? kTick : kCross} ${message}`)

  rl.close()

  return result
}
