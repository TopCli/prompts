// Import Node.js Dependencies
import assert from "node:assert";
import { describe, it, beforeEach } from "node:test";

// Import Internal Dependencies
import { PromptAgent } from "../src/prompt-agent.ts";

describe("PromptAgent", () => {
  describe("shared()", () => {
    it("should always return the same instance", () => {
      const a = PromptAgent.shared();
      const b = PromptAgent.shared();

      assert.strictEqual(a, b);
    });

    it("should return a PromptAgent instance", () => {
      const agent = PromptAgent.shared();

      assert.ok(agent instanceof PromptAgent);
    });
  });

  describe("nextAnswer()", () => {
    let agent: PromptAgent<string>;

    beforeEach(() => {
      agent = new PromptAgent<string>();
    });

    it("should push a single string value into nextAnswers", () => {
      agent.nextAnswer("hello");

      assert.deepStrictEqual(agent.nextAnswers, ["hello"]);
    });

    it("should push multiple scalar values in order", () => {
      agent.nextAnswer("first");
      agent.nextAnswer("second");
      agent.nextAnswer("third");

      assert.deepStrictEqual(agent.nextAnswers, ["first", "second", "third"]);
    });

    it("should spread an array value into nextAnswers", () => {
      agent.nextAnswer(["a", "b", "c"]);

      assert.deepStrictEqual(agent.nextAnswers, ["a", "b", "c"]);
    });

    it("should spread array elements after existing answers", () => {
      agent.nextAnswer("first");
      agent.nextAnswer(["second", "third"]);

      assert.deepStrictEqual(agent.nextAnswers, ["first", "second", "third"]);
    });

    it("should work with boolean values", () => {
      const boolAgent = new PromptAgent<boolean>();
      boolAgent.nextAnswer(true);
      boolAgent.nextAnswer(false);

      assert.deepStrictEqual(boolAgent.nextAnswers, [true, false]);
    });
  });

  describe("clear()", () => {
    let agent: PromptAgent<string>;

    beforeEach(() => {
      agent = new PromptAgent<string>();
    });

    it("should empty nextAnswers", () => {
      agent.nextAnswer("a");
      agent.nextAnswer("b");
      agent.clear();

      assert.deepStrictEqual(agent.nextAnswers, []);
    });

    it("should do nothing when nextAnswers is already empty", () => {
      agent.clear();

      assert.deepStrictEqual(agent.nextAnswers, []);
    });

    it("should allow adding answers again after clearing", () => {
      agent.nextAnswer("before");
      agent.clear();
      agent.nextAnswer("after");

      assert.deepStrictEqual(agent.nextAnswers, ["after"]);
    });
  });

  describe("nextAnswers (initial state)", () => {
    it("should start with an empty array", () => {
      const agent = new PromptAgent<string>();

      assert.deepStrictEqual(agent.nextAnswers, []);
    });
  });
});
