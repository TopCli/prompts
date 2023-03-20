import { prompt, confirm, select } from './index.js'

const kTestRunner = ['node', 'tap', 'tape', 'vitest', 'mocha', 'ava']

const name = await prompt('Project name ?')
const runner = await select('Choose a test runner', { choices: kTestRunner, maxVisible: 5 })
const isCLI = await confirm('Your project is a CLI ?', { initial: true })

console.log(name, runner, isCLI)
