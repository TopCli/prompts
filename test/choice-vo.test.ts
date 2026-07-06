// Import Node.js Dependencies
import assert from "node:assert";
import { describe, it } from "node:test";

// Import Internal Dependencies
import { ChoiceVO } from "../src/choice-vo.ts";

describe("ChoiceVO", () => {
  it("should normalize a plain string choice", () => {
    const choice = new ChoiceVO("foo");

    assert.strictEqual(choice.value, "foo");
    assert.strictEqual(choice.label, "foo");
    assert.strictEqual(choice.description, undefined);
    assert.strictEqual(choice.disabled, false);
    assert.strictEqual(choice.disabledReason, undefined);
  });

  it("should normalize a choice object", () => {
    const choice = new ChoiceVO({ value: "foo", label: "Foo", description: "bar" });

    assert.strictEqual(choice.value, "foo");
    assert.strictEqual(choice.label, "Foo");
    assert.strictEqual(choice.description, "bar");
    assert.strictEqual(choice.disabled, false);
    assert.strictEqual(choice.disabledReason, undefined);
  });

  it("should resolve disabled: true to disabled without a reason", () => {
    const choice = new ChoiceVO({ value: "foo", label: "Foo", disabled: true });

    assert.strictEqual(choice.disabled, true);
    assert.strictEqual(choice.disabledReason, undefined);
  });

  it("should resolve a string disabled reason", () => {
    const choice = new ChoiceVO({ value: "foo", label: "Foo", disabled: "not available" });

    assert.strictEqual(choice.disabled, true);
    assert.strictEqual(choice.disabledReason, "not available");
  });

  it("should resolve disabled: false to not disabled", () => {
    const choice = new ChoiceVO({ value: "foo", label: "Foo", disabled: false });

    assert.strictEqual(choice.disabled, false);
    assert.strictEqual(choice.disabledReason, undefined);
  });

  describe("matches()", () => {
    it("should match case-insensitively by default", () => {
      const choice = new ChoiceVO({ value: "foo", label: "Foo Bar" });

      assert.strictEqual(choice.matches("foo"), true);
      assert.strictEqual(choice.matches("FOO"), true);
    });

    it("should not match a different case when caseSensitive is true", () => {
      const choice = new ChoiceVO({ value: "foo", label: "Foo Bar" });

      assert.strictEqual(choice.matches("foo", true), false);
      assert.strictEqual(choice.matches("Foo", true), true);
    });

    it("should match when every word of a multi-word query is included", () => {
      const choice = new ChoiceVO({ value: "foo", label: "Foo Bar Baz" });

      assert.strictEqual(choice.matches("bar baz"), true);
      assert.strictEqual(choice.matches("bar qux"), false);
    });

    it("should not match an unrelated query", () => {
      const choice = new ChoiceVO({ value: "foo", label: "Foo" });

      assert.strictEqual(choice.matches("qux"), false);
    });
  });

  describe("descriptionSuffix", () => {
    it("should return an empty string when there is no description", () => {
      const choice = new ChoiceVO({ value: "foo", label: "Foo" });

      assert.strictEqual(choice.descriptionSuffix, "");
    });

    it("should format the description when present", () => {
      const choice = new ChoiceVO({ value: "foo", label: "Foo", description: "bar" });

      assert.strictEqual(choice.descriptionSuffix, " - bar");
    });
  });

  describe("disabledHint", () => {
    it("should return an empty string when not disabled", () => {
      const choice = new ChoiceVO({ value: "foo", label: "Foo" });

      assert.strictEqual(choice.disabledHint, "");
    });

    it("should return an empty string when disabled without a reason", () => {
      const choice = new ChoiceVO({ value: "foo", label: "Foo", disabled: true });

      assert.strictEqual(choice.disabledHint, "");
    });

    it("should format the disabled reason when present", () => {
      const choice = new ChoiceVO({ value: "foo", label: "Foo", disabled: "not available" });

      assert.strictEqual(choice.disabledHint, " [not available]");
    });
  });
});
