/* eslint-disable max-lines */
/* eslint-disable max-len */
// Import Node.js Dependencies
import assert from "node:assert";
import { describe, it } from "node:test";

// Import Internal Dependencies
import { MultiselectPrompt } from "../src/prompts/multiselect.js";
import { TestingPrompt } from "./helpers/testing-prompt.js";
import { mockProcess } from "./helpers/mock-process.js";
import { PromptAgent } from "../src/prompt-agent.js";
import { multiselect, required } from "../index.js";

const kInputs = {
  toggleAll: { name: "a", ctrl: true },
  down: { name: "down" },
  return: { name: "return" },
  left: { name: "left" },
  right: { name: "right" }
};
const kPromptAgent = PromptAgent.agent();

describe("MultiselectPrompt", () => {
  it("message should be required", () => {
    assert.throws(() => new MultiselectPrompt({ message: 12 as any } as any), {
      name: "TypeError",
      message: "message must be string, number given."
    });
  });

  it("choices should be required", () => {
    assert.throws(() => new MultiselectPrompt({ message: "foo" } as any), {
      name: "TypeError",
      message: "Missing required param: choices"
    });
  });

  it("choice.label should be required", () => {
    assert.throws(() => new MultiselectPrompt({
      message: "foo",
      choices: [{
        description: "foo",
        value: true
      } as any]
    }), {
      name: "TypeError",
      message: "Missing label for choice {\"description\":\"foo\",\"value\":true}"
    });
  });

  it("choice.value should be required", () => {
    assert.throws(() => new MultiselectPrompt({
      message: "foo",
      choices: [{
        label: "foo",
        description: "bar"
      } as any]
    }), {
      name: "TypeError",
      message: "Missing value for choice {\"label\":\"foo\",\"description\":\"bar\"}"
    });
  });


  it("should throw AbortError", async() => {
    const { stdin, stdout } = mockProcess();

    await assert.rejects(async() => {
      await multiselect("Choose", { choices: ["foo"], signal: AbortSignal.timeout(5), stdin, stdout });
    }, {
      name: "AbortError",
      message: "Prompt aborted"
    });
  });

  it("When press <return> with 0 selected choice, it should return empty list.", async() => {
    const message = "Choose between foo & bar";
    const options = {
      choices: ["foo", "bar"]
    };
    const logs: string[] = [];
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
      "? Choose between foo & bar (Press <Ctrl+A> to toggle all, <Left/Right> to toggle, <Return> to submit)",
      "  ○ foo",
      "  ○ bar",
      "✖ Choose between foo & bar ›"
    ]);
  });

  it("When press <right> then <return>, it should return an array with first choice.", async() => {
    const message = "Choose between foo & bar";
    const options = {
      choices: ["foo", "bar"]
    };
    const inputs = [kInputs.right, kInputs.return];
    const logs: string[] = [];
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
      "? Choose between foo & bar (Press <Ctrl+A> to toggle all, <Left/Right> to toggle, <Return> to submit)",
      "  ○ foo",
      "  ○ bar",
      // we press <space> so the first choice 'foo' is selected
      "  ● foo",
      "  ○ bar",
      // we press <return> so the first choice 'foo' is returned
      "✔ Choose between foo & bar › foo"
    ]);
  });

  it("When press <down> then <right> then <return>, it should return an array with the second choice.", async() => {
    const logs: string[] = [];
    const message = "Choose between foo & bar";
    const options = {
      choices: ["foo", "bar"]
    };
    const inputs = [
      kInputs.down,
      kInputs.right,
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
      "? Choose between foo & bar (Press <Ctrl+A> to toggle all, <Left/Right> to toggle, <Return> to submit)",
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

  it("When press <right> then <down> then <right> then <return>, it should return an array with all choice.", async() => {
    const logs: string[] = [];
    const message = "Choose between foo & bar";
    const options = {
      choices: ["foo", "bar"]
    };
    const inputs = [
      kInputs.right,
      kInputs.down,
      kInputs.right,
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
      "? Choose between foo & bar (Press <Ctrl+A> to toggle all, <Left/Right> to toggle, <Return> to submit)",
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

  it("When press <right> then <left> then <return>, it should return an empty array.", async() => {
    const logs: string[] = [];
    const message = "Choose between foo & bar";
    const options = {
      choices: ["foo", "bar"]
    };
    const inputs = [
      kInputs.right,
      kInputs.left,
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
      "? Choose between foo & bar (Press <Ctrl+A> to toggle all, <Left/Right> to toggle, <Return> to submit)",
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

  it("When press <ctrl+a>, it should toggle all.", async() => {
    const logs: string[] = [];
    const message = "Choose between foo, bar & baz";
    const options = {
      choices: ["foo", "bar", "baz"]
    };
    const inputs = [
      kInputs.toggleAll,
      kInputs.toggleAll,
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
      "? Choose between foo, bar & baz (Press <Ctrl+A> to toggle all, <Left/Right> to toggle, <Return> to submit)",
      "  ○ foo",
      "  ○ bar",
      "  ○ baz",
      // we press <ctrl+a>, it toggle all
      "  ● foo",
      "  ● bar",
      "  ● baz",
      // we press <ctrl+a>, it toggle all
      "  ○ foo",
      "  ○ bar",
      "  ○ baz",
      // we press <return> so [] is returned
      "✖ Choose between foo, bar & baz ›"
    ]);
    assert.deepStrictEqual(input, []);
  });

  it("should work with choice objects.", async() => {
    const logs: string[] = [];
    const message = "Choose between foo & bar";
    const options = {
      choices: [
        { value: "foo", label: "foo" },
        { value: "bar", label: "bar" }
      ]
    };
    const inputs = [
      kInputs.right,
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
      "? Choose between foo & bar (Press <Ctrl+A> to toggle all, <Left/Right> to toggle, <Return> to submit)",
      "  ○ foo",
      "  ○ bar",
      // we press <right> so the first choice 'foo' is selected
      "  ● foo",
      "  ○ bar",
      // we press <return> so the first choice 'foo' is returned
      "✔ Choose between foo & bar › foo"
    ]);
    assert.deepStrictEqual(input, ["foo"]);
  });

  it("When the first item is selected and the up arrow is pressed, the last item should be selected.", async() => {
    const logs: string[] = [];
    const message = "Choose between foo & bar";
    const options = {
      choices: [
        { value: "foo", label: "foo" },
        { value: "bar", label: "bar" }
      ]
    };
    const inputs = [
      kInputs.down,
      kInputs.right,
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
      "? Choose between foo & bar (Press <Ctrl+A> to toggle all, <Left/Right> to toggle, <Return> to submit)",
      "  ○ foo",
      "  ○ bar",
      // we press <up-arrow> so the last choice 'bar' is the active one
      "  ○ foo",
      "  ○ bar",
      // we press <right> so the last choice 'bar' is selected
      "  ○ foo",
      "  ● bar",
      // we press <return> so the last choice 'bar' is returned
      "✔ Choose between foo & bar › bar"
    ]);
    assert.deepEqual(input, ["bar"]);
  });

  it("Should display 5 choices and allow scrolling.", async() => {
    const logs: string[] = [];
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
      kInputs.right,
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
      "? Choose option (Press <Ctrl+A> to toggle all, <Left/Right> to toggle, <Return> to submit)",
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
      // The user presses the right key and the active option is selected
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
    const logs: string[] = [];
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
    const logs: string[] = [];
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
      "? Choose between foo & bar (Press <Ctrl+A> to toggle all, <Left/Right> to toggle, <Return> to submit)",
      // bar is pre-selected
      "  ○ foo",
      "  ● bar",
      // we press <return> so 'bar' is returned
      "✔ Choose between foo & bar › bar"
    ]);
    assert.deepStrictEqual(input, ["bar"]);
  });

  it("should return the answer set via PromptAgent", async() => {
    const logs: string[] = [];
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

  it("should render with validation error.", async() => {
    const logs: string[] = [];
    const message = "Choose between foo & bar";
    const options = {
      choices: ["foo", "bar"],
      validators: [required()]
    };
    const inputs = [
      kInputs.return,
      kInputs.right,
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
      "? Choose between foo & bar (Press <Ctrl+A> to toggle all, <Left/Right> to toggle, <Return> to submit)",
      "  ○ foo",
      "  ○ bar",
      // we press <return> so it re-render question with error
      "? Choose between foo & bar (Press <Ctrl+A> to toggle all, <Left/Right> to toggle, <Return> to submit) [required]",
      "  ○ foo",
      "  ○ bar",
      // we press <right> so it select 'foo'
      "  ● foo",
      "  ○ bar",
      // we press <return> so 'foo' is returned
      "✔ Choose between foo & bar › foo"
    ]);
    assert.deepEqual(input, ["foo"]);
  });

  it("should filter values with autocomplete", async() => {
    const logs: string[] = [];
    const message = "Choose between foo, bar & baz";
    const options = {
      choices: ["foo", "bar", "baz"],
      autocomplete: true
    };
    const inputs = [
      { sequence: "b" },
      { sequence: "a" },
      kInputs.toggleAll,
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
      "? Choose between foo, bar & baz (Press <Ctrl+A> to toggle all, <Left/Right> to toggle, <Return> to submit)",
      "› ",
      "  ○ foo",
      "  ○ bar",
      "  ○ baz",
      // we press <b> so it filters values with 'b'
      "› b",
      "  ○ bar",
      "  ○ baz",
      // we press <b> so it filters values with 'ba'
      "› ba",
      "  ○ bar",
      "  ○ baz",
      // we press <Ctrl+A> so it select all
      "› ba",
      "  ● bar",
      "  ● baz",
      // we press <return> so 'foo' is returned
      "✔ Choose between foo, bar & baz › bar, baz"
    ]);
    assert.deepEqual(input, ["bar", "baz"]);
  });

  it("should filter all choices with autocomplete when using backspace", async() => {
    const logs: string[] = [];
    const message = "Choose between foo, bar & baz";
    const options = {
      choices: ["foo", "bar", "baz"],
      autocomplete: true
    };
    const inputs = [
      { sequence: "b" },
      { sequence: "a" },
      { name: "backspace" },
      { name: "backspace" },
      kInputs.toggleAll,
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
      "? Choose between foo, bar & baz (Press <Ctrl+A> to toggle all, <Left/Right> to toggle, <Return> to submit)",
      "› ",
      "  ○ foo",
      "  ○ bar",
      "  ○ baz",
      // we press <b> so it filters values with 'b'
      "› b",
      "  ○ bar",
      "  ○ baz",
      // we press <a> so it filters values with 'ba'
      "› ba",
      "  ○ bar",
      "  ○ baz",
      // we press <backspace> so it filters values with 'b'
      "› b",
      "  ○ bar",
      "  ○ baz",
      // we press <backspace> so it filters all values
      "› ",
      "  ○ foo",
      "  ○ bar",
      "  ○ baz",
      // we press <Ctrl+A> so it select all
      "› ",
      "  ● foo",
      "  ● bar",
      "  ● baz",
      // we press <return> so 'foo' is returned
      "✔ Choose between foo, bar & baz › foo, bar, baz"
    ]);
    assert.deepEqual(input, ["foo", "bar", "baz"]);
  });

  it("validators should works with autocomplete", async() => {
    const logs: string[] = [];
    const message = "Choose between foo, bar & baz";
    const options = {
      choices: ["foo", "bar", "baz"],
      autocomplete: true,
      validators: [required()]
    };
    const inputs = [
      { sequence: "b" },
      { sequence: "a" },
      kInputs.return,
      kInputs.toggleAll,
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
      "? Choose between foo, bar & baz (Press <Ctrl+A> to toggle all, <Left/Right> to toggle, <Return> to submit)",
      "› ",
      "  ○ foo",
      "  ○ bar",
      "  ○ baz",
      // we press <b> so it filters values with 'b'
      "› b",
      "  ○ bar",
      "  ○ baz",
      // we press <a> so it filters values with 'ba'
      "› ba",
      "  ○ bar",
      "  ○ baz",
      // we press <return> so it re-render question with error
      "? Choose between foo, bar & baz (Press <Ctrl+A> to toggle all, <Left/Right> to toggle, <Return> to submit) [required]",
      "› ba",
      "  ○ bar",
      "  ○ baz",
      // we press <Ctrl+A> so it select all
      "› ba",
      "  ● bar",
      "  ● baz",
      // we press <return> so 'bar, baz' is returned
      "✔ Choose between foo, bar & baz › bar, baz"
    ]);
    assert.deepEqual(input, ["bar", "baz"]);
  });

  it("autocomplete filters should be case insensitive by default", async() => {
    const logs: string[] = [];
    const message = "Choose between foo, bar & baz";
    const options = {
      choices: ["foo", "bar", "baz"],
      autocomplete: true
    };
    const inputs = [
      { sequence: "B" },
      kInputs.toggleAll,
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
      "? Choose between foo, bar & baz (Press <Ctrl+A> to toggle all, <Left/Right> to toggle, <Return> to submit)",
      "› ",
      "  ○ foo",
      "  ○ bar",
      "  ○ baz",
      // we press <B> so it filters values with 'b' or 'B' (case insensitive)
      "› B",
      "  ○ bar",
      "  ○ baz",
      // we press <Ctrl+A> so it select all
      "› B",
      "  ● bar",
      "  ● baz",
      // we press <return> so 'bar, baz' is returned
      "✔ Choose between foo, bar & baz › bar, baz"
    ]);
    assert.deepEqual(input, ["bar", "baz"]);
  });

  it("autocomplete filters should be case sensitive", async() => {
    const logs: string[] = [];
    const message = "Choose between foo, bar & baz";
    const options = {
      choices: ["foo", "bar", "baz"],
      autocomplete: true,
      caseSensitive: true
    };
    const inputs = [
      { sequence: "B" },
      kInputs.toggleAll,
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
      "? Choose between foo, bar & baz (Press <Ctrl+A> to toggle all, <Left/Right> to toggle, <Return> to submit)",
      "› ",
      "  ○ foo",
      "  ○ bar",
      "  ○ baz",
      // we press <B> so it filters no value (case sensitive)
      "› B",
      // we press <Ctrl+A> so it select nothing
      "› B",
      // we press <return> so nothing is returned
      "✖ Choose between foo, bar & baz ›"
    ]);
    assert.deepEqual(input, []);
  });

  it("should not show hint.", async() => {
    const logs: string[] = [];
    const message = "Choose between foo & bar";
    const options = {
      choices: ["foo", "bar"],
      showHint: false
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
      "? Choose between foo & bar",
      "  ○ foo",
      "  ○ bar",
      // we press <return> so it returns nothing
      "✖ Choose between foo & bar ›"
    ]);
    assert.deepEqual(input, []);
  });

  it("should render error without hint.", async() => {
    const logs: string[] = [];
    const message = "Choose between foo & bar";
    const options = {
      choices: ["foo", "bar"],
      validators: [required()],
      showHint: false
    };
    const inputs = [
      kInputs.return,
      kInputs.right,
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
      "? Choose between foo & bar",
      "  ○ foo",
      "  ○ bar",
      // we press <return> so it re-render question with error
      "? Choose between foo & bar [required]",
      "  ○ foo",
      "  ○ bar",
      // we press <right> so it select 'foo'
      "  ● foo",
      "  ○ bar",
      // we press <return> so 'foo' is returned
      "✔ Choose between foo & bar › foo"
    ]);
    assert.deepEqual(input, ["foo"]);
  });
});
