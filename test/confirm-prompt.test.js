// Import Node.js Dependencies
import assert from "node:assert";
import { describe, it } from "node:test";

// Import Internal Dependencies
import { ConfirmPrompt } from "../src/confirm-prompt.js";
import { TestingPrompt } from "./helpers/testing-prompt.js";
import { confirm } from "../index.js";
import { mockProcess } from "./helpers/mock-process.js";
import { PromptAgent } from "../src/prompt-agent.js";

// CONSTANTS
const kInputs = {
  left: { name: "left" },
  right: { name: "right" },
  tab: { name: "tab" },
  q: { name: "q" },
  a: { name: "a" },
  d: { name: "d" },
  h: { name: "h" },
  j: { name: "j" },
  k: { name: "k" },
  l: { name: "l" },
  space: { name: "space" },
  return: { name: "return" }
};
const kPromptAgent = PromptAgent.agent();

describe("ConfirmPrompt", () => {
  it("message should be required", () => {
    assert.throws(() => new ConfirmPrompt(12), { name: "TypeError", message: "message must be string, number given." });
  });

  it("should return initial, which is equal to false by default", async() => {
    const logs = [];
    const confirmPrompt = await TestingPrompt.ConfirmPrompt("Foo", {
      inputs: [kInputs.return],
      onStdoutWrite: (log) => logs.push(log)
    });
    const input = await confirmPrompt.confirm();

    assert.deepEqual(input, false);
    assert.deepEqual(logs, [
      "? Foo Yes/No",
      "✖ Foo"
    ]);
  });

  it("should return true when instant return with initial 'true'", async() => {
    const logs = [];
    const confirmPrompt = await TestingPrompt.ConfirmPrompt("Foo", {
      inputs: [kInputs.return],
      initial: true,
      onStdoutWrite: (log) => logs.push(log)
    });
    const input = await confirmPrompt.confirm();

    assert.deepEqual(input, true);
    assert.deepEqual(logs, [
      "? Foo Yes/No",
      "✔ Foo"
    ]);
  });

  for (const key of Object.keys(kInputs)) {
    if (key === "return") {
      continue;
    }

    it(`should switch value when pressing "${key}"`, async() => {
      const logs = [];
      const confirmPrompt = await TestingPrompt.ConfirmPrompt("Foo", {
        inputs: [kInputs[key], kInputs.return],
        onStdoutWrite: (log) => logs.push(log)
      });
      const input = await confirmPrompt.confirm();

      assert.deepEqual(input, true);
      assert.deepEqual(logs, [
        "? Foo Yes/No",
        "? Foo Yes/No",
        "✔ Foo"
      ]);
    });

    it(`should switch value multiple time when pressing "${key}"`, async() => {
      const logs = [];
      const confirmPrompt = await TestingPrompt.ConfirmPrompt("Foo", {
        inputs: [kInputs[key], kInputs[key], kInputs.return],
        onStdoutWrite: (log) => logs.push(log)
      });
      const input = await confirmPrompt.confirm();

      assert.deepEqual(input, false);
      assert.deepEqual(logs, [
        "? Foo Yes/No",
        "? Foo Yes/No",
        "? Foo Yes/No",
        "✖ Foo"
      ]);
    });
  }

  it("should return the answer (true) set via PromptAgent", async() => {
    const logs = [];
    const { stdin, stdout } = mockProcess([], (text) => logs.push(text));
    kPromptAgent.nextAnswer(true);

    const input = await confirm("Foo", { stdin, stdout });

    assert.equal(input, true);
    assert.deepStrictEqual(logs, [
      "✔ Foo"
    ]);
  });

  it("should return the answer (false) set via PromptAgent", async() => {
    const logs = [];
    const { stdin, stdout } = mockProcess([], (text) => logs.push(text));
    kPromptAgent.nextAnswer(false);

    const input = await confirm("Foo", { stdin, stdout });

    assert.equal(input, false);
    assert.deepStrictEqual(logs, [
      "✖ Foo"
    ]);
  });
});
