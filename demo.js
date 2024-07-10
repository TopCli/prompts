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
    // Select ignore input
    "ava",
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

const questionResponse = await question("Question input", { defaultValue: "foo" });
const selectResponse = await select("Select input", { choices: stringSelect, maxVisible: 5 });
const selectIgnoreResponse = await select(
  "Select ignore input",
  { choices: stringSelect, maxVisible: 5, ignoreValues: ["tap", "tape"] }
);
const selectAutocompleteResponse = await select(
  "Select input /w autocomplete",
  { choices: choiceSelect, maxVisible: 5, autocomplete: true }
);
const confirmResponse = await confirm("Confirm input", { initial: true });
const multiselectResponse = await multiselect("Multiselect input", {
  choices: stringSelect,
  preSelectedChoices: ["node"]
});
const multiselectAutocompleteResponse = await multiselect("Multiselect input /w autocomplete", {
  choices: choiceSelect,
  preSelectedChoices: ["tap"],
  autocomplete: true
});

console.log({
  questionResponse,
  selectResponse,
  selectIgnoreResponse,
  selectAutocompleteResponse,
  confirmResponse,
  multiselectResponse,
  multiselectAutocompleteResponse
});
