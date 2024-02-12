import { question, confirm, select, multiselect, PromptAgent } from "./dist/index.js";

const kTestRunner = ["node", "tap", "tape", "vitest", "mocha", "ava"];

const name = await question("Project name ?", { defaultValue: "foo" });
const runner = await select("Choose a test runner", { choices: kTestRunner, maxVisible: 5 });
const runner_complete = await select("Choose a test runner", { choices: kTestRunner, maxVisible: 5, autocomplete: true });
const isCLI = await confirm("Your project is a CLI ?", { initial: true });
const os = await multiselect("Choose OS", {
  choices: ["linux", "mac", "windows"],
  preSelectedChoices: ["linux"]
});
console.log(name, runner, runner_complete, isCLI, os);

const agent = PromptAgent.agent();
agent.nextAnswer(["toto", "tap", "tape", false, "linux"]);

const _name = await question("Project name ?", { defaultValue: "foo" });
// const _runner = await select("Choose a test runner", { choices: kTestRunner, maxVisible: 5 });
const _runner_complete = await select("Choose a test runner", { choices: kTestRunner, maxVisible: 5, autocomplete: true });
const _isCLI = await confirm("Your project is a CLI ?", { initial: true });
const _os = await multiselect("Choose OS", {
  choices: ["linux", "mac", "windows"],
  preSelectedChoices: ["linux"]
});
console.log(_name, _runner_complete, _isCLI, _os);
