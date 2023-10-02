// Import Node.js Dependencies
import assert from "node:assert";
import { describe, it } from "node:test";

// Import Internal Dependencies
import { MultiselectPrompt } from "../src/multiselect-prompt.js";
import { TestingPrompt } from "./helpers/testing-prompt.js";
import { mockProcess } from "./helpers/mock-process.js";
import { PromptAgent } from "../src/prompt-agent.js";
import { multiselect } from "../index.js";

const kInputs = {
  a: { name: "a" },
  down: { name: "down" },
  return: { name: "return" },
  space: { name: "space" }
};
const kPromptAgent = PromptAgent.agent();

describe("MultiselectPrompt", () => {
  it("message should be required", () => {
    assert.throws(() => new MultiselectPrompt(12), {
      name: "TypeError",
      message: "message must be string, number given."
    });
  });

  it("Options should be required", () => {
    assert.throws(() => new MultiselectPrompt("foo"), {
      name: "TypeError",
      message: "Missing required options"
    });
  });

  it("choices should be required", () => {
    assert.throws(() => new MultiselectPrompt("foo", {}), {
      name: "TypeError",
      message: "Missing required param: choices"
    });
  });

  it("choice.label should be required", () => {
    assert.throws(() => new MultiselectPrompt("foo", {
      choices: [{
        description: "foo",
        value: true
      }]
    }), {
      name: "TypeError",
      message: "Missing label for choice {\"description\":\"foo\",\"value\":true}"
    });
  });

  it("choice.value should be required", () => {
    assert.throws(() => new MultiselectPrompt("foo", {
      choices: [{
        label: "foo",
        description: "bar"
      }]
    }), {
      name: "TypeError",
      message: "Missing value for choice {\"label\":\"foo\",\"description\":\"bar\"}"
    });
  });

  it("When press <return> with 0 selected choice, it should return empty list.", async() => {
    const message = "Choose between foo & bar";
    const options = {
      choices: ["foo", "bar"]
    };
    const logs = [];
    const multiselectPrompt = await TestingPrompt.MultiselectPrompt(
      message,
      {
        ...options,
        inputs: [kInputs.return],
        onStdoutWrite: (log) => logs.push(log)
      }
    );

    const input = await multiselectPrompt.multiselect();

    assert.deepEqual(input, []);
    assert.deepStrictEqual(logs, [
      "? Choose between foo & bar (Press <a> to toggle all, <space> to select, <return> to submit)",
      "  ○ foo",
      "  ○ bar",
      "✖ Choose between foo & bar ›"
    ]);
  });

  it("When press <space> then <return>, it should return an array with first choice.", async() => {
    const message = "Choose between foo & bar";
    const options = {
      choices: ["foo", "bar"]
    };
    const inputs = [kInputs.space, kInputs.return];
    const logs = [];
    const multiselectPrompt = await TestingPrompt.MultiselectPrompt(
      message,
      {
        ...options,
        inputs,
        onStdoutWrite: (log) => logs.push(log)
      }
    );

    const input = await multiselectPrompt.multiselect();

    assert.deepEqual(input, ["foo"]);
    assert.deepStrictEqual(logs, [
      "? Choose between foo & bar (Press <a> to toggle all, <space> to select, <return> to submit)",
      "  ○ foo",
      "  ○ bar",
      // we press <space> so the first choice 'foo' is selected
      "  ● foo",
      "  ○ bar",
      // we press <return> so the first choice 'foo' is returned
      "✔ Choose between foo & bar › foo"
    ]);
  });

  it("When press <down> then <span> then <return>, it should return an array with the second choice.", async() => {
    const logs = [];
    const message = "Choose between foo & bar";
    const options = {
      choices: ["foo", "bar"]
    };
    const inputs = [
      kInputs.down,
      kInputs.space,
      kInputs.return
    ];
    const multiselectPrompt = await TestingPrompt.MultiselectPrompt(
      message,
      {
        ...options,
        inputs,
        onStdoutWrite: (log) => logs.push(log)
      }
    );

    const input = await multiselectPrompt.multiselect();

    assert.deepStrictEqual(logs, [
      "? Choose between foo & bar (Press <a> to toggle all, <space> to select, <return> to submit)",
      "  ○ foo",
      "  ○ bar",
      // We press <down>, cursor moves from "foo" to "bar"
      "  ○ foo",
      "  ○ bar",
      // we press <space> so the second choice 'bar' is selected
      "  ○ foo",
      "  ● bar",
      // we press <return> so the first choice 'bar' is returned
      "✔ Choose between foo & bar › bar"
    ]);
    assert.deepStrictEqual(input, ["bar"]);
  });

  it("When press <space> then <down> then <span> then <return>, it should return an array with all choice.", async() => {
    const logs = [];
    const message = "Choose between foo & bar";
    const options = {
      choices: ["foo", "bar"]
    };
    const inputs = [
      kInputs.space,
      kInputs.down,
      kInputs.space,
      kInputs.return
    ];
    const multiselectPrompt = await TestingPrompt.MultiselectPrompt(
      message,
      {
        ...options,
        inputs,
        onStdoutWrite: (log) => logs.push(log)
      }
    );

    const input = await multiselectPrompt.multiselect();

    assert.deepStrictEqual(logs, [
      "? Choose between foo & bar (Press <a> to toggle all, <space> to select, <return> to submit)",
      "  ○ foo",
      "  ○ bar",
      // we press <space> so the first choice 'foo' is selected
      "  ● foo",
      "  ○ bar",
      // We press <down>, cursor moves from "foo" to "bar"
      "  ● foo",
      "  ○ bar",
      // we press <space> so the second choice 'bar' is selected
      "  ● foo",
      "  ● bar",
      // we press <return> so the first choice 'bar' is returned
      "✔ Choose between foo & bar › foo, bar"
    ]);
    assert.deepStrictEqual(input, ["foo", "bar"]);
  });

  it("When press <space> then <space> then <return>, it should return an empty array.", async() => {
    const logs = [];
    const message = "Choose between foo & bar";
    const options = {
      choices: ["foo", "bar"]
    };
    const inputs = [
      kInputs.space,
      kInputs.space,
      kInputs.return
    ];
    const multiselectPrompt = await TestingPrompt.MultiselectPrompt(
      message,
      {
        ...options,
        inputs,
        onStdoutWrite: (log) => logs.push(log)
      }
    );

    const input = await multiselectPrompt.multiselect();

    assert.deepStrictEqual(logs, [
      "? Choose between foo & bar (Press <a> to toggle all, <space> to select, <return> to submit)",
      "  ○ foo",
      "  ○ bar",
      // we press <space> so the first choice 'foo' is selected
      "  ● foo",
      "  ○ bar",
      // We press <space>, so the first choice 'foo' is unselected
      "  ○ foo",
      "  ○ bar",
      // we press <return> so [] is returned
      "✖ Choose between foo & bar ›"
    ]);
    assert.deepStrictEqual(input, []);
  });

  it("When press <a>, it should toggle all.", async() => {
    const logs = [];
    const message = "Choose between foo, bar & baz";
    const options = {
      choices: ["foo", "bar", "baz"]
    };
    const inputs = [
      kInputs.a,
      kInputs.a,
      kInputs.return
    ];
    const multiselectPrompt = await TestingPrompt.MultiselectPrompt(
      message,
      {
        ...options,
        inputs,
        onStdoutWrite: (log) => logs.push(log)
      }
    );

    const input = await multiselectPrompt.multiselect();

    assert.deepStrictEqual(logs, [
      "? Choose between foo, bar & baz (Press <a> to toggle all, <space> to select, <return> to submit)",
      "  ○ foo",
      "  ○ bar",
      "  ○ baz",
      // we press <a>, it toggle all
      "  ● foo",
      "  ● bar",
      "  ● baz",
      // we press <a>, it toggle all
      "  ○ foo",
      "  ○ bar",
      "  ○ baz",
      // we press <return> so [] is returned
      "✖ Choose between foo, bar & baz ›"
    ]);
    assert.deepStrictEqual(input, []);
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
    const inputs = [
      kInputs.space,
      kInputs.return
    ];
    const multiselectPrompt = await TestingPrompt.MultiselectPrompt(
      message,
      {
        ...options,
        inputs,
        onStdoutWrite: (log) => logs.push(log)
      }
    );

    const input = await multiselectPrompt.multiselect();

    assert.deepStrictEqual(logs, [
      "? Choose between foo & bar (Press <a> to toggle all, <space> to select, <return> to submit)",
      "  ○ foo",
      "  ○ bar",
      // we press <space> so the first choice 'foo' is selected
      "  ● foo",
      "  ○ bar",
      // we press <return> so the first choice 'foo' is returned
      "✔ Choose between foo & bar › foo"
    ]);
    assert.deepStrictEqual(input, ["foo"]);
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
      kInputs.down,
      kInputs.space,
      kInputs.return
    ];
    const multiselectPrompt = await TestingPrompt.MultiselectPrompt(
      message,
      {
        ...options,
        inputs,
        onStdoutWrite: (log) => logs.push(log)
      }
    );

    const input = await multiselectPrompt.multiselect();

    assert.deepStrictEqual(logs, [
      "? Choose between foo & bar (Press <a> to toggle all, <space> to select, <return> to submit)",
      "  ○ foo",
      "  ○ bar",
      // we press <up-arrow> so the last choice 'bar' is the active one
      "  ○ foo",
      "  ○ bar",
      // we press <space> so the last choice 'bar' is selected
      "  ○ foo",
      "  ● bar",
      // we press <return> so the last choice 'bar' is returned
      "✔ Choose between foo & bar › bar"
    ]);
    assert.deepEqual(input, ["bar"]);
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
      kInputs.down,
      kInputs.down,
      kInputs.down,
      kInputs.space,
      kInputs.return
    ];
    const multiselectPrompt = await TestingPrompt.MultiselectPrompt(
      message,
      {
        ...options,
        inputs,
        onStdoutWrite: (log) => logs.push(log)
      }
    );

    const input = await multiselectPrompt.multiselect();

    assert.deepStrictEqual(logs, [
      "? Choose option (Press <a> to toggle all, <space> to select, <return> to submit)",
      // Firstly, it renders the first 5 choices. (as maxVisible is 5)
      "  ○ Option 1 ",
      "  ○ Option 2 ",
      "  ○ Option 3 ",
      "  ○ Option 4 ",
      // ⭣ because there are next choices to be displayed (scroll)
      "⭣ ○ Option 5 ",
      // Once the user presses the down arrow, it renders the same choices
      // but the active option is now "Option 2".
      "  ○ Option 1 ",
      "  ○ Option 2 ",
      "  ○ Option 3 ",
      "  ○ Option 4 ",
      "⭣ ○ Option 5 ",
      // On down arrow again, now Option 3 is active.
      "  ○ Option 1 ",
      "  ○ Option 2 ",
      "  ○ Option 3 ",
      "  ○ Option 4 ",
      "⭣ ○ Option 5 ",
      // Still on down arrow, now Option 4 is active and it has scrolled down
      // ⭡ because there are previosu choices to be displayed (scroll)
      "⭡ ○ Option 2 ",
      "  ○ Option 3 ",
      "  ○ Option 4 ",
      "  ○ Option 5 ",
      "⭣ ○ Option 6 ",
      // The user presses the space key and the active option is selected
      "⭡ ○ Option 2 ",
      "  ○ Option 3 ",
      "  ● Option 4 ",
      "  ○ Option 5 ",
      "⭣ ○ Option 6 ",
      // Finally, the user press <return> then the selected option is returned
      "✔ Choose option › Option 4"
    ]);
    assert.deepEqual(input, ["option4"]);
  });

  it("Unknown pre-selected choice should throw", async() => {
    const message = "Choose between foo & bar";
    const options = {
      choices: ["foo", "bar"],
      preSelectedChoices: ["toto"]
    };
    const logs = [];
    await assert.rejects(async() => {
      await TestingPrompt.MultiselectPrompt(
        message,
        {
          ...options,
          inputs: [kInputs.return],
          onStdoutWrite: (log) => logs.push(log)
        }
      );
    });
  });

  it("should pre-selected choices", async() => {
    const logs = [];
    const message = "Choose between foo & bar";
    const options = {
      choices: ["foo", "bar"],
      preSelectedChoices: ["bar"]
    };
    const inputs = [
      kInputs.return
    ];
    const multiselectPrompt = await TestingPrompt.MultiselectPrompt(
      message,
      {
        ...options,
        inputs,
        onStdoutWrite: (log) => logs.push(log)
      }
    );

    const input = await multiselectPrompt.multiselect();

    assert.deepStrictEqual(logs, [
      "? Choose between foo & bar (Press <a> to toggle all, <space> to select, <return> to submit)",
      // bar is pre-selected
      "  ○ foo",
      "  ● bar",
      // we press <return> so 'bar' is returned
      "✔ Choose between foo & bar › bar"
    ]);
    assert.deepStrictEqual(input, ["bar"]);
  });

  it("should return the answer set via PromptAgent", async() => {
    const logs = [];
    const { stdin, stdout } = mockProcess([], (text) => logs.push(text));
    kPromptAgent.nextAnswer("option1");

    const options = {
      choices: [
        { value: "option1", label: "one", description: "foo" },
        { value: "option2", label: "Option 2", description: "foo" },
        { value: "option3", label: "Option three", description: "foo" }
      ],
      maxVisible: 5
    };
    const input = await multiselect("Choose option", { ...options, stdin, stdout });

    assert.equal(input, "option1");
    assert.deepStrictEqual(logs, [
      "✔ Choose option › option1"
    ]);
  });
});
