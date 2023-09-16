import { question, confirm, select, PromptAgent } from "./index.js";

const kTestRunner = ["node", "tap", "tape", "vitest", "mocha", "ava"];

const name = await question("Project name ?", { defaultValue: "foo" });
const runner = await select("Choose a test runner", { choices: kTestRunner, maxVisible: 5 });
const isCLI = await confirm("Your project is a CLI ?", { initial: true });

console.log(name, runner, isCLI);

const agent = PromptAgent.agent();
agent.nextAnswer(["toto", "tap", false]);

const _name = await question("Project name ?", { defaultValue: "foo" });
const _runner = await select("Choose a test runner", { choices: kTestRunner, maxVisible: 5 });
const _isCLI = await confirm("Your project is a CLI ?", { initial: true });

console.log(_name, _runner, _isCLI);
