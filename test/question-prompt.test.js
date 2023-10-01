// Import Node.js Dependencies
import assert from "node:assert";
import { describe, it } from "node:test";

// Import Internal Dependencies
import { QuestionPrompt } from "../src/question-prompt.js";
import { TestingPrompt } from "./helpers/testing-prompt.js";
import { required } from "../src/validators.js";
import { PromptAgent } from "../src/prompt-agent.js";
import { question } from "../index.js";
import { mockProcess } from "./helpers/mock-process.js";

// CONSTANTS
const kPromptAgent = PromptAgent.agent();

describe("QuestionPrompt", () => {
  it("message should be string", () => {
    assert.throws(() => new QuestionPrompt(12), { name: "TypeError", message: "message must be string, number given." });
  });

  it("should render with tick on valid input", async() => {
    const logs = [];
    const { stdin, stdout } = mockProcess([], (text) => logs.push(text));
    kPromptAgent.nextAnswer("Joe");

    const input = await question("What's your name?", { stdin, stdout });

    assert.equal(input, "Joe");
    assert.deepStrictEqual(logs, [
      "✔ What's your name? › Joe"
    ]);
  });

  it("should render cross on invalid input", async() => {
    const logs = [];
    const { stdin, stdout } = mockProcess([], (text) => logs.push(text));
    kPromptAgent.nextAnswer(undefined);

    const input = await question("What's your name?", { stdin, stdout });

    assert.strictEqual(input, undefined);
    assert.deepStrictEqual(logs, [
      "✖ What's your name? › "
    ]);
  });

  it("validator should not pass", async() => {
    const logs = [];
    const questionPrompt = await TestingPrompt.QuestionPrompt("What's your name?", {
      input: ["test1", "test10", "test2"],
      validators: [{
        validate: (input) => !input.startsWith("test1"),
        error: (input) => `Value cannot start with 'test1', given ${input}.`
      }],
      onStdoutWrite: (log) => logs.push(log)
    });
    const input = await questionPrompt.question();
    assert.equal(input, "test2");
    assert.deepStrictEqual(logs, [
      "? What's your name?",
      "? What's your name? [Value cannot start with 'test1', given test1.]",
      "? What's your name? [Value cannot start with 'test1', given test10.]",
      "✔ What's your name? › test2"
    ]);
  });

  it("input should be required", async() => {
    const logs = [];
    const questionPrompt = await TestingPrompt.QuestionPrompt("What's your name?", {
      input: ["", "toto"],
      validators: [required()],
      onStdoutWrite: (log) => logs.push(log)
    });
    const input = await questionPrompt.question();

    assert.equal(input, "toto");
    assert.deepStrictEqual(logs, [
      "? What's your name?",
      "? What's your name? [required]",
      "✔ What's your name? › toto"
    ]);
  });

  it("should return the default value", async() => {
    const logs = [];
    const questionPrompt = await TestingPrompt.QuestionPrompt("What's your name?", {
      input: [""],
      defaultValue: "John Doe",
      onStdoutWrite: (log) => logs.push(log)
    });
    const input = await questionPrompt.question();

    assert.equal(input, "John Doe");
    assert.deepStrictEqual(logs, [
      "? What's your name? (John Doe)",
      "✔ What's your name? › John Doe"
    ]);
  });

  it("should throw when given defaultValue is not a string", async() => {
    await assert.rejects(async() => {
      await TestingPrompt.QuestionPrompt("What's your name?", {
        input: [""],
        defaultValue: { foo: "bar" }
      });
    }, {
      name: "TypeError",
      message: "defaultValue must be a string"
    });
  });
});
