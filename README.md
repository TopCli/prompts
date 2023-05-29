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

You can locally run `node ./demo.js`

```js
import { prompt, confirm, select } from '@topcli/prompts';

const kTestRunner = ['node', 'tap', 'tape', 'vitest', 'mocha', 'ava'];

const name = await prompt('Project name ?');
const runner = await select('Choose a test runner', {
  choices: kTestRunner,
  maxVisible: 5
});
const isCLI = await confirm('Your project is a CLI ?', {
  initial: true
});

console.log(name, runner, isCLI);^
```

## API

### `prompt()`

```ts
prompt(message: string, options?: PromptOptions): Promise<string>
```

Simple prompt, similar to `rl.question()` with an improved UI.
Use `options.validators` to handle user input.

**Example**

```js
const packageName = await prompt('Package name', {
  validators: [
    {
      validate: (value) => !existsSync(join(process.cwd(), value)),
      error: (value) => `Folder ${value} already exists`
    }
  ]
});
```

**This package provide some validators for common usage**

- required

```js
import { prompt, required } from "@topcli/prompts";

const name = await prompt("What's your name ?", {
  validators: [required()]
});
```

### `select()`

```ts
select(message: string, options: SelectOptions): Promise<string>
```

Scrollable select depending `maxVisible` (default `8`).
Use `ignoreValues` to skip result render & clear lines after a selected one.

### `confirm()`

```ts
confirm(message: string, options?: ConfirmOptions): Promise<string>
```

Boolean prompt, return `options.initial` if user input is different from "y"/"yes"/"n"/"no", (default `false`).

## Interfaces

```ts
export interface PromptOptions {
  validators?: {
    validate: (input: string) => boolean;
    error: (input: string) => string;
  }[];
}
```
```ts
export interface Choice {
  value: any;
  label: string;
  description?: string;
}
```

```ts
export interface SelectOptions {
  choices: (Choice | string)[];
  maxVisible?: number = 8;
  ignoreValues?: (string | number | boolean)[];
}
```

```ts
export interface ConfirmOptions {
  initial?: boolean = false;
}
```
