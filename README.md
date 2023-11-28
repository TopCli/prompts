# prompts

![version](https://img.shields.io/badge/dynamic/json.svg?style=for-the-badge&url=https://raw.githubusercontent.com/TopCli/prompts/main/package.json&query=$.version&label=Version)
[![Maintenance](https://img.shields.io/badge/Maintained%3F-yes-green.svg?style=for-the-badge)](https://github.com/TopCli/prompts/commit-activity)
[![isc](https://img.shields.io/badge/License-ISC-blue.svg?style=for-the-badge)](https://github.com/TopCli/prompts/blob/main/LICENSE)
![build](https://img.shields.io/github/actions/workflow/status/TopCli/prompts/node.js.yml?style=for-the-badge)

Node.js user prompt library for command-line interfaces.

## Requirements
- [Node.js](https://nodejs.org/en/) v16 or higher

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
import { question, confirm, select, multiselect } from "@topcli/prompts";

const kTestRunner = ["node", "tap", "tape", "vitest", "mocha", "ava"];

const name = await question("Project name ?", { defaultValue: "foo" });
const runner = await select("Choose a test runner", { choices: kTestRunner, maxVisible: 5 });
const isCLI = await confirm("Your project is a CLI ?", { initial: true });
const os = await multiselect("Choose OS", {
  choices: ["linux", "mac", "windows"],
  preSelectedChoices: ["linux"]
});

console.log(name, runner, isCLI, os);
```

## API

### `question()`

```ts
question(message: string, options?: PromptOptions): Promise<string>
```

Simple prompt, similar to `rl.question()` with an improved UI.
Use `options.secure` if you need to hide both input and answer.
Use `options.validators` to handle user input.

**Example**

```js
const packageName = await question('Package name', {
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

### `multiselect()`

```ts
multiselect(message: string, options: MultiselectOptions): Promise<[string]>
```

Scrollable multiselect depending `maxVisible` (default `8`).  
Use `preSelectedChoices` to pre-select choices.

Use `validators` to handle user input.

**Example**

```js
const os = await multiselect('Choose OS', {
  choices: ["linux", "mac", "windows"]
  validators: [required()]
});
```

Use `autocomplete` to allow filtered choices. This can be usefull for a large list of choices.

### `confirm()`

```ts
confirm(message: string, options?: ConfirmOptions): Promise<boolean>
```

Boolean prompt, return `options.initial` if user input is different from `y`/`yes`/`n`/`no` (case insensitive), (default `false`).

### `PromptAgent`

The `PromptAgent` class allows to programmatically set the next answers for any prompt function, this can be useful for testing.

```ts
const agent = PromptAgent.agent();
agent.nextAnswer("John");

const input = await question("What's your name?");
assert.equal(input, "John");
```

> [!WARNING]
> Answers set with `PromptAgent` will **bypass** any logical & validation rules.
> Examples:
> - When using `question()`, `validators` functions will not be executed.
> - When using `select()`, the answer can be different from the available choices.
> - When using `confirm()`, the answer can be any type other than boolean.
> - etc  
> **Use with caution**

## Interfaces

```ts
export interface SharedOptions {
  stdin?: NodeJS.ReadStream & {
    fd: 0;
  };
  stdout?: NodeJS.WriteStream & {
    fd: 1;
  };
}

export interface Validator {
  validate: (input: string) => boolean;
  error: (input?: string) => string;
}

export interface QuestionOptions extends SharedOptions {
  defaultValue?: string;
  validators?: Validator[];
  secure?: boolean;
}

export interface Choice {
  value: any;
  label: string;
  description?: string;
}

export interface SelectOptions extends SharedOptions  {
  choices: (Choice | string)[];
  maxVisible?: number;
  ignoreValues?: (string | number | boolean)[];
}

export interface MultiselectOptions extends SharedOptions  {
  choices: (Choice | string)[];
  maxVisible?: number;
  preSelectedChoices?: (Choice | string)[];
  validators?: Validator[];
  autocomplete?: boolean;
}

export interface ConfirmOptions extends SharedOptions  {
  initial?: boolean;
}
```

## Contributors

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tbody>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/PierreDemailly"><img src="https://avatars.githubusercontent.com/u/39910767?v=4?s=100" width="100px;" alt="PierreDemailly"/><br /><sub><b>PierreDemailly</b></sub></a><br /><a href="https://github.com/TopCli/prompts/commits?author=PierreDemailly" title="Code">💻</a> <a href="https://github.com/TopCli/prompts/commits?author=PierreDemailly" title="Tests">⚠️</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://www.linkedin.com/in/thomas-gentilhomme/"><img src="https://avatars.githubusercontent.com/u/4438263?v=4?s=100" width="100px;" alt="Gentilhomme"/><br /><sub><b>Gentilhomme</b></sub></a><br /><a href="https://github.com/TopCli/prompts/pulls?q=is%3Apr+reviewed-by%3Afraxken" title="Reviewed Pull Requests">👀</a> <a href="https://github.com/TopCli/prompts/commits?author=fraxken" title="Code">💻</a> <a href="https://github.com/TopCli/prompts/commits?author=fraxken" title="Documentation">📖</a></td>
      <td align="center" valign="top" width="14.28%"><a href="http://tonygo.dev"><img src="https://avatars0.githubusercontent.com/u/22824417?v=4?s=100" width="100px;" alt="Tony Gorez"/><br /><sub><b>Tony Gorez</b></sub></a><br /><a href="https://github.com/TopCli/prompts/pulls?q=is%3Apr+reviewed-by%3Atony-go" title="Reviewed Pull Requests">👀</a></td>
      <td align="center" valign="top" width="14.28%"><a href="http://sofiand.github.io/portfolio-client/"><img src="https://avatars.githubusercontent.com/u/39944043?v=4?s=100" width="100px;" alt="Yefis"/><br /><sub><b>Yefis</b></sub></a><br /><a href="https://github.com/TopCli/prompts/commits?author=SofianD" title="Code">💻</a> <a href="https://github.com/TopCli/prompts/commits?author=SofianD" title="Documentation">📖</a></td>
      <td align="center" valign="top" width="14.28%"><a href="http://justie.dev"><img src="https://avatars.githubusercontent.com/u/7118300?v=4?s=100" width="100px;" alt="Ben"/><br /><sub><b>Ben</b></sub></a><br /><a href="https://github.com/TopCli/prompts/commits?author=JUSTIVE" title="Documentation">📖</a> <a href="#maintenance-JUSTIVE" title="Maintenance">🚧</a></td>
    </tr>
  </tbody>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->
