// Import Node.js Dependencies
import assert from "node:assert";
import { after, describe, it, mock } from "node:test";
import { setTimeout } from "node:timers/promises";

// Import Internal Dependencies
import { QuestionPrompt } from "../src/prompts/question.js";
import { TestingPrompt } from "./helpers/testing-prompt.js";
import { required } from "../src/validators.js";
import { PromptAgent } from "../src/prompt-agent.js";
import { question } from "../index.js";
import { mockProcess } from "./helpers/mock-process.js";

// CONSTANTS
const kPromptAgent = PromptAgent.agent();

describe("QuestionPrompt", () => {
  after(() => {
    mock.reset();
  });

  it("message should be string", () => {
    assert.throws(
      () => new QuestionPrompt({ message: 12 as any } as any),
      { name: "TypeError", message: "message must be string, number given." }
    );
  });

  it("should throw AbortError", async() => {
    const { stdin, stdout } = mockProcess();

    const signal = AbortSignal.timeout(1);
    await setTimeout(10);
    await assert.rejects(async() => {
      await question("What's your name?", { signal, stdin, stdout });
    }, {
      name: "AbortError",
      message: "Prompt aborted"
    });
  });

  it("should render with tick on valid input", async() => {
    const logs: string[] = [];
    const { stdin, stdout } = mockProcess([], (text) => logs.push(text));
    kPromptAgent.nextAnswer("Joe");

    const input = await question("What's your name?", { stdin, stdout });

    assert.equal(input, "Joe");
    assert.deepStrictEqual(logs, [
      "✔ What's your name? › Joe"
    ]);
  });

  it("should render cross on invalid input", async() => {
    const logs: string[] = [];
    const { stdin, stdout } = mockProcess([], (text) => logs.push(text));
    kPromptAgent.nextAnswer("");

    const input = await question("What's your name?", { stdin, stdout });

    assert.strictEqual(input, "");
    assert.deepStrictEqual(logs, [
      "✖ What's your name? › "
    ]);
  });

  it("validator should not pass", async() => {
    const logs: string[] = [];
    const questionPrompt = await TestingPrompt.QuestionPrompt({
      message: "What's your name?",
      inputs: ["test1", "test10", "test2"],
      validators: [{
        validate: (input) => {
          const isValid = !(input as string).startsWith("test1");
          if (!isValid) {
            return { isValid, error: `Value cannot start with 'test1', given ${input}.` };
          }

          return void 0;
        }
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
    const logs: string[] = [];
    const questionPrompt = await TestingPrompt.QuestionPrompt({
      message: "What's your name?",
      inputs: ["", "toto"],
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
    const logs: string[] = [];
    const questionPrompt = await TestingPrompt.QuestionPrompt({
      message: "What's your name?",
      inputs: [""],
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
      await TestingPrompt.QuestionPrompt({
        message: "What's your name?",
        input: [""],
        defaultValue: { foo: "bar" }
      } as any);
    }, {
      name: "TypeError",
      message: "defaultValue must be a string"
    });
  });

  it("should not display answer when prompt is secure", async() => {
    const logs: string[] = [];
    const questionPrompt = await TestingPrompt.QuestionPrompt({
      message: "What's your name?",
      inputs: ["John Deeoe"],
      secure: true,
      onStdoutWrite: (log) => logs.push(log)
    });
    const input = await questionPrompt.question();

    assert.equal(input, "John Deeoe");
    assert.deepStrictEqual(logs, [
      "? What's your name?",
      "✔ What's your name? › CONFIDENTIAL"
    ]);
  });

  it("should not display answer when prompt is secure and using PromptAgent", async() => {
    const logs: string[] = [];
    const { stdin, stdout } = mockProcess([], (text) => logs.push(text));
    kPromptAgent.nextAnswer("John Doe");

    const input = await question("What's your name?", { secure: true, stdin, stdout });

    assert.equal(input, "John Doe");
    assert.deepStrictEqual(logs, [
      "✔ What's your name? › CONFIDENTIAL"
    ]);
  });

  it("should return '' when skipping prompt", async() => {
    const input = await question("What's your name?", {
      skip: true
    });

    assert.equal(input, "");
  });

  it("should return default value when skipping prompt", async() => {
    const input = await question("What's your name?", {
      defaultValue: "John Doe",
      skip: true
    });

    assert.equal(input, "John Doe");
  });
});
