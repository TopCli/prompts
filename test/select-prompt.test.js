/* eslint-disable line-comment-position */

// Import Node.js Dependencies
import assert from "node:assert";
import { describe, it } from "node:test";

// Import Internal Dependencies
import { SelectPrompt } from "../src/select-prompt.js";
import { TestingPrompt } from "./helpers/testing-prompt.js";

describe("SelectPrompt", () => {
  it("message should be required", () => {
    assert.throws(() => new SelectPrompt(12), { name: "TypeError", message: "message must be string, number given." });
  });

  it("Options should be required", () => {
    assert.throws(() => new SelectPrompt("foo"), { name: "TypeError", message: "Missing required options" });
  });

  it("choices should be required", async() => {
    assert.throws(() => new SelectPrompt("foo", { }), { name: "TypeError", message: "Missing required param: choices" });
  });

  it("choice.label should be required", async() => {
    assert.throws(() => new SelectPrompt("foo", {
      choices: [{
        description: "foo",
        value: true
      }]
    }), { name: "TypeError", message: "Missing label for choice {\"description\":\"foo\",\"value\":true}" });
  });

  it("choice.value should be required", async() => {
    assert.throws(() => new SelectPrompt("foo", {
      choices: [{
        label: "foo",
        description: "bar"
      }]
    }), { name: "TypeError", message: "Missing value for choice {\"label\":\"foo\",\"description\":\"bar\"}" });
  });

  it("When press <return>, it should select the first choice.", async() => {
    const message = "Choose between foo & bar";
    const options = {
      choices: ["foo", "bar"]
    };
    const inputs = [{ name: "return" }];
    const logs = [];
    const selectPrompt = await TestingPrompt.SelectPrompt(
      message,
      options,
      inputs,
      (log) => logs.push(log)
    );

    const input = await selectPrompt.select();

    assert.deepEqual(input, "foo");
    assert.deepEqual(logs, [
      "? Choose between foo & bar",
      " › foo",
      "   bar",
      "✔ Choose between foo & bar › foo"
    ]);
  });

  it("When press <down> then <return>, it should select the second choice.", async() => {
    const logs = [];
    const message = "Choose between foo & bar";
    const options = {
      choices: ["foo", "bar"]
    };
    const inputs = [
      { name: "down" },
      { name: "return" }
    ];
    const selectPrompt = await TestingPrompt.SelectPrompt(
      message,
      options,
      inputs,
      (log) => logs.push(log)
    );

    const input = await selectPrompt.select();

    assert.deepEqual(logs, [
      "? Choose between foo & bar",
      " › foo",
      "   bar",
      "   foo",
      " › bar",
      "✔ Choose between foo & bar › bar"
    ]);
    assert.deepEqual(input, "bar");
  });

  it("It should work with choice objects.", async() => {
    const logs = [];
    const message = "Choose between foo & bar";
    const options = {
      choices: [
        { value: "foo", label: "foo" },
        { value: "bar", label: "bar" }
      ]
    };
    const inputs = [{ name: "return" }];
    const selectPrompt = await TestingPrompt.SelectPrompt(
      message,
      options,
      inputs,
      (log) => logs.push(log)
    );

    const input = await selectPrompt.select();

    assert.deepEqual(logs, [
      "? Choose between foo & bar",
      " › foo",
      "   bar",
      "✔ Choose between foo & bar › foo"
    ]);
    assert.deepEqual(input, "foo");
  });

  it("When the first item is selected and the up arrow is pressed, the last item should be selected.", async() => {
    const logs = [];
    const message = "Choose between foo & bar";
    const options = {
      choices: [
        { value: "foo", label: "foo" },
        { value: "bar", label: "bar" }
      ]
    };
    const inputs = [
      { name: "down" },
      { name: "return" }
    ];
    const selectPrompt = await TestingPrompt.SelectPrompt(
      message,
      options,
      inputs,
      (log) => logs.push(log)
    );

    const input = await selectPrompt.select();

    assert.deepEqual(logs, [
      "? Choose between foo & bar",
      " › foo",
      "   bar",
      "   foo",
      " › bar",
      "✔ Choose between foo & bar › bar"
    ]);
    assert.deepEqual(input, "bar");
  });

  it("When the first item is selected and the up arrow is pressed, the last item should be selected.", async() => {
    const logs = [];
    const message = "Choose between foo & bar";
    const options = {
      choices: [
        { value: "foo", label: "foo" },
        { value: "bar", label: "bar" }
      ]
    };
    const inputs = [
      { name: "down" },
      { name: "down" },
      { name: "return" }
    ];
    const selectPrompt = await TestingPrompt.SelectPrompt(
      message,
      options,
      inputs,
      (log) => logs.push(log)
    );

    const input = await selectPrompt.select();

    assert.deepEqual(logs, [
      "? Choose between foo & bar",
      " › foo",
      "   bar",
      "   foo",
      " › bar",
      " › foo",
      "   bar",
      "✔ Choose between foo & bar › foo"
    ]);
    assert.deepEqual(input, "foo");
  });

  it("It should ignore foo.", async() => {
    const logs = [];
    const message = "Choose between foo & bar";
    const options = {
      choices: [
        { value: "foo", label: "foo" },
        { value: "bar", label: "bar" }
      ],
      ignoreValues: ["foo"]
    };
    const inputs = [{ name: "return" }];
    const selectPrompt = await TestingPrompt.SelectPrompt(
      message,
      options,
      inputs,
      (log) => logs.push(log)
    );

    const input = await selectPrompt.select();

    assert.deepEqual(logs, [
      "? Choose between foo & bar",
      " › foo",
      "   bar"
      // '✔ Choose between foo & bar › foo'
    ]);
    assert.deepEqual(input, "foo");
  });

  it("Should display 5 choices and allow scrolling.", async() => {
    const logs = [];
    const message = "Choose option";
    const options = {
      choices: [
        { value: "option1", label: "Option 1" },
        { value: "option2", label: "Option 2" },
        { value: "option3", label: "Option 3" },
        { value: "option4", label: "Option 4" },
        { value: "option5", label: "Option 5" },
        { value: "option6", label: "Option 6" },
        { value: "option7", label: "Option 7" },
        { value: "option8", label: "Option 8" },
        { value: "option9", label: "Option 9" },
        { value: "option10", label: "Option 10" }
      ],
      maxVisible: 5
    };
    const inputs = [
      { name: "down" },
      { name: "down" },
      { name: "down" },
      { name: "return" }
    ];
    const selectPrompt = await TestingPrompt.SelectPrompt(
      message,
      options,
      inputs,
      (log) => logs.push(log)
    );

    const input = await selectPrompt.select();

    assert.deepEqual(logs, [
      "? Choose option",
      // Firstly, it renders the first 5 choices. (as maxVisible is 5)
      " › Option 1 ",
      "   Option 2 ",
      "   Option 3 ",
      "   Option 4 ",

      // ⭣ because there are next choices to be displayed (scroll)
      "⭣  Option 5 ",
      // Once the user presses the down arrow, it renders the same choices
      // but the selected option is now "Option 2".
      "   Option 1 ",
      " › Option 2 ",
      "   Option 3 ",
      "   Option 4 ",
      "⭣  Option 5 ",
      // On down arrow again, now Option 3 is selected.
      "   Option 1 ",
      "   Option 2 ",
      " › Option 3 ",
      "   Option 4 ",
      "⭣  Option 5 ",
      // Still on down arrow, now Option 4 is selected and it has scrolled down

      // ⭡ because there are previosu choices to be displayed (scroll)
      "⭡  Option 2 ",
      "   Option 3 ",
      " › Option 4 ",
      "   Option 5 ",
      "⭣  Option 6 ",
      // Finally, the user presses the return key and the selected option is returned & displayed.
      "✔ Choose option › Option 4"
    ]);
    assert.deepEqual(input, "option4");
  });

  it("Choices descriptions should be aligned.", async() => {
    const logs = [];
    const message = "Choose option";
    const options = {
      choices: [
        { value: "option1", label: "one", description: "foo" },
        { value: "option2", label: "Option 2", description: "foo" }
      ],
      maxVisible: 5
    };
    const inputs = [
      { name: "return" }
    ];
    const selectPrompt = await TestingPrompt.SelectPrompt(
      message,
      options,
      inputs,
      (log) => logs.push(log)
    );

    const input = await selectPrompt.select();

    assert.deepEqual(logs, [
      "? Choose option",
      " › one      - foo",
      "   Option 2 - foo",
      "✔ Choose option › one"
    ]);
    assert.deepEqual(input, "option1");
  });

  it("Choices descriptions should not be aligned as longest choice is too long.", async() => {
    const logs = [];
    const message = "Choose option";
    const options = {
      choices: [
        { value: "option1", label: "one", description: "foo" },
        { value: "option2", label: "Option 2", description: "foo" },
        { value: "option3", label: "Option three", description: "foo" }
      ],
      maxVisible: 5
    };
    const inputs = [
      { name: "return" }
    ];
    const selectPrompt = await TestingPrompt.SelectPrompt(
      message,
      options,
      inputs,
      (log) => logs.push(log)
    );

    const input = await selectPrompt.select();

    assert.deepEqual(logs, [
      "? Choose option",
      " › one - foo",
      "   Option 2 - foo",
      "   Option three - foo",
      "✔ Choose option › one"
    ]);
    assert.deepEqual(input, "option1");
  });
});
