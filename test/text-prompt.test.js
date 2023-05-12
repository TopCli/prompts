// Import Node.js Dependencies
import assert from "node:assert";
import { describe, it } from "node:test";

// Import Internal Dependencies
import { TextPrompt } from "../src/text-prompt.js";
import { TestingPrompt } from "./helpers/testing-prompt.js";

describe("TextPrompt", () => {
  it("message should be string", async() => {
    assert.throws(() => new TextPrompt(12), { name: "TypeError", message: "message must be string, number given." });
  });

  it("should render with tick on valid input", async() => {
    const logs = [];
    const textPrompt = await TestingPrompt.TextPrompt("What's your name?", "Joe", (log) => logs.push(log));
    const input = await textPrompt.question();
    assert.deepEqual(input, "Joe");
    assert.deepEqual(logs, [
      "? What's your name?",
      "✔ What's your name? › Joe"
    ]);
  });

  it("should render cross on invalid input", async() => {
    const logs = [];
    const textPrompt = await TestingPrompt.TextPrompt("What's your name?", undefined, (log) => logs.push(log));
    const input = await textPrompt.question();
    assert.deepEqual(input, undefined);
    assert.deepEqual(logs, [
      "? What's your name?",
      "✖ What's your name? › "
    ]);
  });

  it("validator should not pass", async() => {
    const logs = [];
    const textPrompt = await TestingPrompt.TextPrompt(
      "What's your name?",
      ["test1", "test10", "test2"],
      (log) => logs.push(log),
      [{
        validate: (input) => !input.startsWith("test1"),
        error: (input) => `Value cannot start with 'test1', given ${input}.`
      }]
    );
    const input = await textPrompt.question();
    assert.deepEqual(input, "test2");
    assert.deepEqual(logs, [
      "? What's your name?",
      "? What's your name? [Value cannot start with 'test1', given test1.]",
      "? What's your name? [Value cannot start with 'test1', given test10.]",
      "✔ What's your name? › test2"
    ]);
  });
});
