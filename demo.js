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
  agent.nextAnswer([
    // Question input
    "toto",
    // Select input
    "node",
    // Select input /w autocomplete
    "tape",
    // Confirm input
    false,
    // Multiselect input
    "node",
    // Multiselect input /w autocomplete
    ["tap", "tape"]
  ]);
}

const name = await question("Question input", { defaultValue: "foo" });
const runner = await select("Select input", { choices: stringSelect, maxVisible: 5 });
const runner_complete = await select(
  "Select input /w autocomplete",
  { choices: choiceSelect, maxVisible: 5, autocomplete: true }
);
const isCLI = await confirm("Confirm input", { initial: true });
const os = await multiselect("Multiselect input", {
  choices: stringSelect,
  preSelectedChoices: ["node"]
});
const os_autocomplete = await multiselect("Multiselect input /w autocomplete", {
  choices: choiceSelect,
  preSelectedChoices: ["tap"]
});


console.log({ name, runner, runner_complete, isCLI, os, os_autocomplete });
