// Import Node.js Dependencies
import assert from "node:assert";
import { describe, it } from "node:test";

// Import Internal Dependencies
import { ConfirmPrompt } from "../src/confirm-prompt.js";
import { TestingPrompt } from "./helpers/testing-prompt.js";

describe("ConfirmPrompt", () => {
  it("message should be required", async() => {
    assert.throws(() => new ConfirmPrompt(12), { name: "TypeError", message: "message must be string, number given." });
  });

  it("should return initial, which is equal false by default", async() => {
    const logs = [];
    const confirmPrompt = await TestingPrompt.ConfirmPrompt("Foo", {
      input: undefined,
      onStdoutWrite: (log) => logs.push(log)
    });
    const input = await confirmPrompt.confirm();

    assert.deepEqual(input, false);
    assert.deepEqual(logs, [
      "? Foo (yes/No)",
      "✖ Foo"
    ]);
  });

  it("should return true given input \"y\"", async() => {
    const logs = [];
    const confirmPrompt = await TestingPrompt.ConfirmPrompt("Foo", {
      input: "y",
      onStdoutWrite: (log) => logs.push(log)
    });
    const input = await confirmPrompt.confirm();

    assert.deepEqual(input, true);
    assert.deepEqual(logs, [
      "? Foo (yes/No)",
      "✔ Foo"
    ]);
  });

  it("should return true given input \"yes\"", async() => {
    const logs = [];
    const confirmPrompt = await TestingPrompt.ConfirmPrompt("Foo", {
      input: "yes",
      onStdoutWrite: (log) => logs.push(log)
    });
    const input = await confirmPrompt.confirm();

    assert.deepEqual(input, true);
    assert.deepEqual(logs, [
      "? Foo (yes/No)",
      "✔ Foo"
    ]);
  });

  it("should return false given input \"n\"", async() => {
    const logs = [];
    const confirmPrompt = await TestingPrompt.ConfirmPrompt("Foo", {
      input: "n",
      onStdoutWrite: (log) => logs.push(log)
    });
    const input = await confirmPrompt.confirm();

    assert.deepEqual(input, false);
    assert.deepEqual(logs, [
      "? Foo (yes/No)",
      "✖ Foo"
    ]);
  });

  it("should return false given input \"no\"", async() => {
    const logs = [];
    const confirmPrompt = await TestingPrompt.ConfirmPrompt("Foo", {
      input: "no",
      onStdoutWrite: (log) => logs.push(log)
    });
    const input = await confirmPrompt.confirm();

    assert.deepEqual(input, false);
    assert.deepEqual(logs, [
      "? Foo (yes/No)",
      "✖ Foo"
    ]);
  });

  it("input should not be case sensitive", async() => {
    const logs = [];
    const confirmPrompt = await TestingPrompt.ConfirmPrompt("Foo", {
      input: "yEs",
      onStdoutWrite: (log) => logs.push(log)
    });
    const input = await confirmPrompt.confirm();

    assert.deepEqual(input, true);
    assert.deepEqual(logs, [
      "? Foo (yes/No)",
      "✔ Foo"
    ]);
  });

  it("should return initial (true) when input is not 'y'|'yes'|'n'|'no'", async() => {
    const logs = [];
    const confirmPrompt = await TestingPrompt.ConfirmPrompt("Foo", {
      input: "bar",
      initial: true,
      onStdoutWrite: (log) => logs.push(log)
    });
    const input = await confirmPrompt.confirm();

    assert.deepEqual(input, true);
    assert.deepEqual(logs, [
      "? Foo (Yes/no)",
      "✔ Foo"
    ]);
  });

  it("should return initial (false) when input is not 'y'|'yes'|'n'|'no'", async() => {
    const logs = [];
    const confirmPrompt = await TestingPrompt.ConfirmPrompt("Foo", {
      input: "bar",
      initial: false,
      onStdoutWrite: (log) => logs.push(log)
    });
    const input = await confirmPrompt.confirm();

    assert.deepEqual(input, false);
    assert.deepEqual(logs, [
      "? Foo (yes/No)",
      "✖ Foo"
    ]);
  });
});
