# prompts

![version](https://img.shields.io/badge/dynamic/json.svg?style=for-the-badge&url=https://raw.githubusercontent.com/TopCli/prompts/main/package.json&query=$.version&label=Version)
[![Maintenance](https://img.shields.io/badge/Maintained%3F-yes-green.svg?style=for-the-badge)](https://github.com/TopCli/prompts/commit-activity)
[![isc](https://img.shields.io/badge/License-ISC-blue.svg?style=for-the-badge)](https://github.com/TopCli/prompts/blob/main/LICENSE)
![build](https://img.shields.io/github/actions/workflow/status/TopCli/prompts/node.js.yml?style=for-the-badge)

Node.js user input library for command-line interfaces.

## Requirements
- [Node.js](https://nodejs.org/en/) v14 or higher

## Getting Started

> **Note** This package is ESM only.

This package is available in the Node Package Repository and can be easily installed with [npm](https://docs.npmjs.com/getting-started/what-is-npm) or [yarn](https://yarnpkg.com).

```bash
$ npm i @topcli/prompts
# or
$ yarn add @topcli/prompts
```

## Usage exemple

```js
import { prompt, select, confirm } from '@topcli/prompts'

const name = await prompt('What\'s your name ?')
const gender = await select('What\'s your gender ?', {
  choices: [
    {
      value: 'M',
      label: 'Male'
    },
    {
      value: 'F',
      label: 'Female'
    },
  ]
})
const isAdult = await confirm('Are you over 18 ?', { initial: true })
```

## API

### `prompt()`

```ts
prompt(message: string): Promise<string>
```

Simple prompt, similar to `rl.question()` with an improved UI.

### `select()`

```ts
select(message: string, options: { choices: (Choice | string)[], maxVisible?: number, ignoreValues?: (string | number | boolean)[] }): Promise<string>
```

Scrollable select depending `maxVisible` (default `8`).
Use `ignoreValues` to skip result render & clear lines after a selected one.

### `confirm()`

```ts
confirm(message: string, options?: { initial: boolean }): Promise<string>
```

Boolean prompt, return `options.initial` if user input is different from "y"/"yes"/"n"/"no", (default `false`).

## Interfaces

```ts
export interface Choice {
  value: any,
  label: string,
  description?: string,
}
```
