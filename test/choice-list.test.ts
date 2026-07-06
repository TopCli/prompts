// Import Node.js Dependencies
import assert from "node:assert";
import { describe, it } from "node:test";

// Import Internal Dependencies
import { ChoiceList } from "../src/choice-list.ts";
import { ChoiceVO } from "../src/choice-vo.ts";

describe("ChoiceList", () => {
  describe("from()", () => {
    it("should throw when a choice object is missing a label", () => {
      assert.throws(
        // @ts-expect-error
        () => ChoiceList.from([{ value: "foo" }]),
        { name: "TypeError", message: /Missing label for choice/ }
      );
    });

    it("should throw when a choice object is missing a value", () => {
      assert.throws(
        // @ts-expect-error
        () => ChoiceList.from([{ label: "Foo" }]),
        { name: "TypeError", message: /Missing value for choice/ }
      );
    });

    it("should throw when there is no non-separator choice", () => {
      assert.throws(
        () => ChoiceList.from([{ type: "separator" }]),
        { name: "TypeError", message: "choices must contain at least one non-separator item" }
      );
    });

    it("should normalize plain strings, choice objects and keep separators as-is", () => {
      const list = ChoiceList.from<string>(["foo", { value: "bar", label: "Bar" }, { type: "separator" }]);

      assert.strictEqual(list.length, 3);
      assert.ok(list.at(0) instanceof ChoiceVO);
      assert.ok(list.at(1) instanceof ChoiceVO);
      assert.deepStrictEqual(list.at(2), { type: "separator" });
    });
  });

  describe("iteration", () => {
    it("should support length, at() and for...of", () => {
      const list = ChoiceList.from(["foo", "bar"]);

      assert.strictEqual(list.length, 2);
      assert.strictEqual((list.at(0) as ChoiceVO<string>).value, "foo");
      assert.strictEqual((list.at(1) as ChoiceVO<string>).value, "bar");
      assert.deepStrictEqual([...list].map((item) => (item as ChoiceVO<string>).value), ["foo", "bar"]);
    });
  });

  describe("filtered()", () => {
    it("should only keep choices matching the query", () => {
      const list = ChoiceList.from(["foo", "bar", "baz"]);
      const filtered = list.filtered("ba");

      assert.strictEqual(filtered.length, 2);
      assert.deepStrictEqual([...filtered].map((item) => (item as ChoiceVO<string>).value), ["bar", "baz"]);
    });

    it("should drop separators when a query is applied", () => {
      const list = ChoiceList.from(["foo", { type: "separator" }, "bar"]);
      const filtered = list.filtered("a");

      assert.strictEqual(filtered.length, 1);
      assert.strictEqual((filtered.at(0) as ChoiceVO<string>).value, "bar");
    });

    it("should respect caseSensitive", () => {
      const list = ChoiceList.from(["Foo", "bar"]);

      assert.strictEqual(list.filtered("foo", true).length, 0);
      assert.strictEqual(list.filtered("Foo", true).length, 1);
    });
  });

  describe("nextEnabledIndex()", () => {
    it("should skip separators and disabled choices moving forward", () => {
      const list = ChoiceList.from<string>([
        "foo",
        { type: "separator" },
        { value: "bar", label: "Bar", disabled: true },
        "baz"
      ]);

      assert.strictEqual(list.nextEnabledIndex(0, 1), 3);
    });

    it("should skip separators and disabled choices moving backward and wrap around", () => {
      const list = ChoiceList.from<string>([
        "foo",
        { type: "separator" },
        { value: "bar", label: "Bar", disabled: true },
        "baz"
      ]);

      assert.strictEqual(list.nextEnabledIndex(0, -1), 3);
    });

    it("should return the starting index when there is nothing else enabled", () => {
      const list = ChoiceList.from(["foo"]);

      assert.strictEqual(list.nextEnabledIndex(0, 1), 0);
    });
  });

  describe("firstEnabledIndex()", () => {
    it("should return the index of the first non-separator, non-disabled choice", () => {
      const list = ChoiceList.from<string>(
        [{ type: "separator" }, { value: "foo", label: "Foo", disabled: true }, "bar"]
      );

      assert.strictEqual(list.firstEnabledIndex(), 2);
    });

    it("should return 0 when every choice is disabled", () => {
      const list = ChoiceList.from([{ value: "foo", label: "Foo", disabled: true }]);

      assert.strictEqual(list.firstEnabledIndex(), 0);
    });
  });

  describe("visibleRange()", () => {
    it("should center the window around the active index", () => {
      const list = ChoiceList.from(["a", "b", "c", "d", "e", "f", "g", "h", "i", "j"]);

      assert.deepStrictEqual(list.visibleRange(5, 4), { startIndex: 3, endIndex: 7 });
    });

    it("should clamp the window to the start of the list", () => {
      const list = ChoiceList.from(["a", "b", "c", "d", "e"]);

      assert.deepStrictEqual(list.visibleRange(0, 4), { startIndex: 0, endIndex: 4 });
    });

    it("should clamp the window to the end of the list", () => {
      const list = ChoiceList.from(["a", "b", "c", "d", "e"]);

      assert.deepStrictEqual(list.visibleRange(4, 4), { startIndex: 1, endIndex: 5 });
    });
  });

  describe("longestLabelLength", () => {
    it("should return the length of the longest selectable label", () => {
      const list = ChoiceList.from(["foo", "barbaz", { type: "separator" }]);

      assert.strictEqual(list.longestLabelLength, 6);
    });
  });

  describe("indexOf()", () => {
    it("should return the index matching the given value", () => {
      const list = ChoiceList.from(["foo", "bar"]);

      assert.strictEqual(list.indexOf("bar"), 1);
    });

    it("should return -1 when the value is not found", () => {
      const list = ChoiceList.from<string>(["foo", "bar"]);

      assert.strictEqual(list.indexOf("qux"), -1);
    });

    it("should not match separators", () => {
      const list = ChoiceList.from(["foo", { type: "separator" }]);

      assert.strictEqual(list.indexOf("qux"), -1);
    });
  });
});
