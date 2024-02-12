import { question, confirm, select, multiselect, PromptAgent } from "./dist/index.js";

const stringSelect = ["node", "tap", "tape", "vitest", "mocha", "ava"];

const choiceSelect = [
  { value: "node", label: "Node" },
  { value: "tap", label: "Tap" },
  { value: "tape", label: "Tape" },
  { value: "vitest", label: "ViTest" },
  { value: "mocha", label: "Mocha" },
  { value: "ava", label: "AVA" }
];

const interactive = await confirm("Interactive demo?", { initial: true });

if (!interactive) {
  const agent = PromptAgent.agent();
  agent.nextAnswer(["toto", "node", "tape", false, "node", "tap, tape"]);
}

const name = await question("Project name ?", { defaultValue: "foo" });
const runner = await select("Choose a test runner", { choices: stringSelect, maxVisible: 5 });
const runner_complete = await select(
  "Choose a test runner (autocomplete)",
  { choices: choiceSelect, maxVisible: 5, autocomplete: true }
);
const isCLI = await confirm("Your project is a CLI ?", { initial: true });
const os = await multiselect("Choose OS", {
  choices: stringSelect,
  preSelectedChoices: ["node"]
});
const os2 = await multiselect("Choose OS (autocomplete)", {
  choices: choiceSelect,
  preSelectedChoices: ["tap"]
});


console.log({ name, runner, runner_complete, isCLI, os, os2 });
