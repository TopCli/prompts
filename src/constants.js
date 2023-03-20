// Import Third-party Dependencies
import ansi from 'ansi-styles'

const kPointer = `${ansi.gray.open}›${ansi.gray.close}`

export const SYMBOLS = {
  QuestionMark: `${ansi.blue.open}?${ansi.blue.close}`,
  Tick: `${ansi.green.open}✔${ansi.green.close}`,
  Cross: `${ansi.red.open}✖${ansi.red.close}`,
  Pointer: kPointer,
  Active: `${ansi.reset.open}${kPointer}`,
  Inactive: `${ansi.gray.open}`,
  Previous: '⭡',
  Next: '⭣',
  ShowCursor: '\x1B[?25h',
  HideCursor: '\x1B[?25l'
}
