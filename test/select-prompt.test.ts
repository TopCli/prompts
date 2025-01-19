// Import Node.js Dependencies
import assert from "node:assert";
import { after, describe, it, mock } from "node:test";
import { setTimeout } from "node:timers/promises";

// Import Internal Dependencies
import { SelectPrompt } from "../src/prompts/select.js";
import { TestingPrompt } from "./helpers/testing-prompt.js";
import { mockProcess } from "./helpers/mock-process.js";
import { PromptAgent } from "../src/prompt-agent.js";
import { select, required } from "../index.js";

const kInputs = {
  down: { name: "down" },
  return: { name: "return" }
};
const kPromptAgent = PromptAgent.agent();

describe("SelectPrompt", () => {
  after(() => {
    mock.reset();
  });

  it("message should be required", () => {
    assert.throws(() => new SelectPrompt({ message: 12 as any } as any), {
      name: "TypeError",
      message: "message must be string, number given."
    });
  });

  it("choices should be required", () => {
    assert.throws(() => new SelectPrompt({ message: "foo" } as any), {
      name: "TypeError",
      message: "Missing required param: choices"
    });
  });

  it("choice.label should be required", () => {
    assert.throws(() => new SelectPrompt({
      message: "foo",
      choices: [{
        description: "foo",
        value: true
      }] as any
    }), {
      name: "TypeError",
      message: "Missing label for choice {\"description\":\"foo\",\"value\":true}"
    });
  });

  it("choice.value should be required", () => {
    assert.throws(() => new SelectPrompt({
      message: "foo",
      choices: [{
        label: "foo",
        description: "bar"
      }] as any
    }), {
      name: "TypeError",
      message: "Missing value for choice {\"label\":\"foo\",\"description\":\"bar\"}"
    });
  });

  it("should throw AbortError", async() => {
    const { stdin, stdout } = mockProcess();

    const signal = AbortSignal.timeout(1);
    await setTimeout(10);
    await assert.rejects(async() => {
      await select("Choose", { choices: ["foo"], signal, stdin, stdout });
    }, {
      name: "AbortError",
      message: "Prompt aborted"
    });
  });

  it("When press <return>, it should select the first choice.", async() => {
    const options = {
      message: "Choose between foo & bar",
      choices: ["foo", "bar"]
    };
    const inputs = [kInputs.return];
    const logs: string[] = [];
    const selectPrompt = await TestingPrompt.SelectPrompt({
      ...options,
      inputs,
      onStdoutWrite: (log) => logs.push(log)
    });

    const input = await selectPrompt.select();

    assert.equal(input, "foo");
    assert.deepStrictEqual(logs, [
      "? Choose between foo & bar",
      " › foo",
      "   bar",
      "✔ Choose between foo & bar › foo"
    ]);
  });

  it("When press <down> then <return>, it should select the second choice.", async() => {
    const logs: string[] = [];
    const options = {
      message: "Choose between foo & bar",
      choices: ["foo", "bar"]
    };
    const inputs = [
      kInputs.down,
      kInputs.return
    ];
    const selectPrompt = await TestingPrompt.SelectPrompt({
      ...options,
      inputs,
      onStdoutWrite: (log) => logs.push(log)
    });

    const input = await selectPrompt.select();

    assert.deepStrictEqual(logs, [
      "? Choose between foo & bar",
      " › foo",
      "   bar",
      "   foo",
      " › bar",
      "✔ Choose between foo & bar › bar"
    ]);
    assert.equal(input, "bar");
  });

  it("should work with choice objects.", async() => {
    const logs: string[] = [];
    const options = {
      message: "Choose between foo & bar",
      choices: [
        { value: "foo", label: "foo" },
        { value: "bar", label: "bar" }
      ]
    };
    const selectPrompt = await TestingPrompt.SelectPrompt({
      ...options,
      inputs: [kInputs.return],
      onStdoutWrite: (log) => logs.push(log)
    });

    const input = await selectPrompt.select();

    assert.deepStrictEqual(logs, [
      "? Choose between foo & bar",
      " › foo",
      "   bar",
      "✔ Choose between foo & bar › foo"
    ]);
    assert.equal(input, "foo");
  });

  it("When the first item is selected and the up arrow is pressed, the last item should be selected.", async() => {
    const logs: string[] = [];
    const options = {
      message: "Choose between foo & bar",
      choices: [
        { value: "foo", label: "foo" },
        { value: "bar", label: "bar" }
      ]
    };
    const inputs = [
      kInputs.down,
      kInputs.return
    ];
    const selectPrompt = await TestingPrompt.SelectPrompt({
      ...options,
      inputs,
      onStdoutWrite: (log) => logs.push(log)
    });

    const input = await selectPrompt.select();

    assert.deepStrictEqual(logs, [
      "? Choose between foo & bar",
      " › foo",
      "   bar",
      "   foo",
      " › bar",
      "✔ Choose between foo & bar › bar"
    ]);
    assert.equal(input, "bar");
  });

  it("When the first item is selected and the up arrow is pressed, the last item should be selected.", async() => {
    const logs: string[] = [];
    const options = {
      message: "Choose between foo & bar",
      choices: [
        { value: "foo", label: "foo" },
        { value: "bar", label: "bar" }
      ]
    };
    const inputs = [
      kInputs.down,
      kInputs.down,
      kInputs.return
    ];
    const selectPrompt = await TestingPrompt.SelectPrompt({
      ...options,
      inputs,
      onStdoutWrite: (log) => logs.push(log)
    });

    const input = await selectPrompt.select();

    assert.deepStrictEqual(logs, [
      "? Choose between foo & bar",
      " › foo",
      "   bar",
      "   foo",
      " › bar",
      " › foo",
      "   bar",
      "✔ Choose between foo & bar › foo"
    ]);
    assert.equal(input, "foo");
  });

  it("should ignore foo.", async() => {
    const logs: string[] = [];
    const options = {
      message: "Choose between foo & bar",
      choices: [
        { value: "foo", label: "foo" },
        { value: "bar", label: "bar" }
      ],
      ignoreValues: ["foo"]
    };
    const selectPrompt = await TestingPrompt.SelectPrompt({
      ...options,
      inputs: [kInputs.return],
      onStdoutWrite: (log) => logs.push(log)
    });

    const input = await selectPrompt.select();

    assert.equal(input, "foo");
    assert.deepStrictEqual(logs, [
      "? Choose between foo & bar",
      " › foo",
      "   bar"
      // '✔ Choose between foo & bar › foo' <-- not displayed because foo is ignored
    ]);
  });

  it("Should display 5 choices and allow scrolling.", async() => {
    const logs: string[] = [];
    const options = {
      message: "Choose option",
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
      kInputs.return
    ];
    const selectPrompt = await TestingPrompt.SelectPrompt({
      ...options,
      inputs,
      onStdoutWrite: (log) => logs.push(log)
    });

    const input = await selectPrompt.select();

    assert.deepStrictEqual(logs, [
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
    assert.equal(input, "option4");
  });

  it("Choices descriptions should be aligned.", async() => {
    const logs: string[] = [];
    const options = {
      message: "Choose option",
      choices: [
        { value: "option1", label: "one", description: "foo" },
        { value: "option2", label: "Option 2", description: "foo" }
      ],
      maxVisible: 5
    };
    const selectPrompt = await TestingPrompt.SelectPrompt({
      ...options,
      inputs: [kInputs.return],
      onStdoutWrite: (log) => logs.push(log)
    });

    const input = await selectPrompt.select();

    assert.deepStrictEqual(logs, [
      "? Choose option",
      " › one      - foo",
      "   Option 2 - foo",
      "✔ Choose option › one"
    ]);
    assert.equal(input, "option1");
  });

  it("Choices descriptions should not be aligned as longest choice is too long.", async() => {
    const logs: string[] = [];
    const options = {
      message: "Choose option",
      choices: [
        { value: "option1", label: "one", description: "foo" },
        { value: "option2", label: "Option 2", description: "foo" },
        { value: "option3", label: "Option three", description: "foo" }
      ],
      maxVisible: 5
    };
    const selectPrompt = await TestingPrompt.SelectPrompt({
      ...options,
      inputs: [kInputs.return],
      onStdoutWrite: (log) => logs.push(log)
    });

    const input = await selectPrompt.select();

    assert.deepEqual(logs, [
      "? Choose option",
      " › one - foo",
      "   Option 2 - foo",
      "   Option three - foo",
      "✔ Choose option › one"
    ]);
    assert.equal(input, "option1");
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
    const input = await select("Choose option", { ...options, stdin, stdout });

    assert.equal(input, "option1");
    assert.deepStrictEqual(logs, [
      "✔ Choose option › option1"
    ]);
  });

  it("should return the answer set via PromptAgent with autocomplete", async() => {
    const logs: string[] = [];
    const { stdin, stdout } = mockProcess([], (text) => logs.push(text));
    kPromptAgent.nextAnswer("option1");

    const options = {
      choices: [
        { value: "option1", label: "one", description: "foo" },
        { value: "option2", label: "Option 2", description: "foo" },
        { value: "option3", label: "Option three", description: "foo" }
      ],
      maxVisible: 5,
      autocomplete: true
    };
    const input = await select("Choose option", { ...options, stdin, stdout });

    assert.equal(input, "option1");
    assert.deepStrictEqual(logs, [
      "✔ Choose option › option1"
    ]);
  });

  it("should filter values with autocomplete", async() => {
    const logs: string[] = [];
    const options = {
      message: "Choose between foo, bar or baz",
      choices: ["foo", "bar", "baz"],
      autocomplete: true
    };
    const inputs = [
      { sequence: "b" },
      { sequence: "a" },
      kInputs.return
    ];
    const selectPrompt = await TestingPrompt.SelectPrompt({
      ...options,
      inputs,
      onStdoutWrite: (log) => logs.push(log)
    });

    const input = await selectPrompt.select();

    assert.deepStrictEqual(logs, [
      "? Choose between foo, bar or baz",
      "› ",
      " › foo",
      "   bar",
      "   baz",
      // we press <b> so it filters values with 'b'
      "› b",
      " › bar",
      "   baz",
      // we press <a> so it filters values with 'ba'
      "› ba",
      " › bar",
      "   baz",
      // we press <return> so 'bar' is returned
      "✔ Choose between foo, bar or baz › bar"
    ]);
    assert.equal(input, "bar");
  });

  it("should filter all choices with autocomplete when using backspace", async() => {
    const logs: string[] = [];
    const options = {
      message: "Choose between foo, bar or baz",
      choices: ["foo", "bar", "baz"],
      autocomplete: true
    };
    const inputs = [
      { sequence: "b" },
      { sequence: "a" },
      { name: "backspace" },
      { name: "backspace" },
      kInputs.return
    ];
    const selectPrompt = await TestingPrompt.SelectPrompt({
      ...options,
      inputs,
      onStdoutWrite: (log) => logs.push(log)
    });

    const input = await selectPrompt.select();

    assert.deepStrictEqual(logs, [
      "? Choose between foo, bar or baz",
      "› ",
      " › foo",
      "   bar",
      "   baz",
      // we press <b> so it filters values with 'b'
      "› b",
      " › bar",
      "   baz",
      // we press <a> so it filters values with 'ba'
      "› ba",
      " › bar",
      "   baz",
      // we press <backspace> so it filters values with 'b'
      "› b",
      " › bar",
      "   baz",
      // we press <backspace> so it filters all values
      "› ",
      " › foo",
      "   bar",
      "   baz",
      // we press <return> so 'foo' is returned
      "✔ Choose between foo, bar or baz › foo"
    ]);
    assert.equal(input, "foo");
  });

  it("autocomplete filters should be case insensitive by default", async() => {
    const logs: string[] = [];
    const options = {
      message: "Choose between foo, bar or baz",
      choices: ["foo", "bar", "baz"],
      autocomplete: true
    };
    const inputs = [
      { sequence: "B" },
      kInputs.return
    ];
    const selectPrompt = await TestingPrompt.SelectPrompt({
      ...options,
      inputs,
      onStdoutWrite: (log) => logs.push(log)
    });

    const input = await selectPrompt.select();

    assert.deepStrictEqual(logs, [
      "? Choose between foo, bar or baz",
      "› ",
      " › foo",
      "   bar",
      "   baz",
      // we press <B> so it filters values with 'b' or 'B' (case insensitive)
      "› B",
      " › bar",
      "   baz",
      // we press <return> so 'bar' is returned
      "✔ Choose between foo, bar or baz › bar"
    ]);
    assert.equal(input, "bar");
  });

  it("autocomplete filters should be case sensitive", async() => {
    const logs: string[] = [];
    const options = {
      message: "Choose between foo, bar or baz",
      choices: ["foo", "bar", "baz"],
      autocomplete: true,
      caseSensitive: true
    };
    const inputs = [
      { sequence: "B" },
      { name: "backspace" },
      { sequence: "b" },
      kInputs.return
    ];
    const selectPrompt = await TestingPrompt.SelectPrompt({
      ...options,
      inputs,
      onStdoutWrite: (log) => logs.push(log)
    });

    const input = await selectPrompt.select();

    assert.deepStrictEqual(logs, [
      "? Choose between foo, bar or baz",
      "› ",
      " › foo",
      "   bar",
      "   baz",
      // we press <B> so it filters no value (case sensitive)
      "› B",
      // we press <backspace> to reset the filter
      "› ",
      " › foo",
      "   bar",
      "   baz",
      // we press <b> so it filters value (case sensitive)
      "› b",
      " › bar",
      "   baz",
      // we press <return> so 'bar' is returned
      "✔ Choose between foo, bar or baz › bar"
    ]);
    assert.equal(input, "bar");
  });

  it("should fallback to empty string if filter returns empty choice list", async() => {
    const logs: string[] = [];
    const options = {
      message: "Choose between foo, bar or baz",
      choices: ["foo", "bar", "baz"],
      autocomplete: true,
      caseSensitive: true
    };
    const inputs = [
      { sequence: "B" },
      kInputs.return
    ];
    const selectPrompt = await TestingPrompt.SelectPrompt({
      ...options,
      inputs,
      onStdoutWrite: (log) => logs.push(log)
    });

    const input = await selectPrompt.select();

    assert.deepStrictEqual(logs, [
      "? Choose between foo, bar or baz",
      "› ",
      " › foo",
      "   bar",
      "   baz",
      // we press <B> so it filters no value (case sensitive)
      "› B",
      // we press <return> and an empty string is returned
      "✖ Choose between foo, bar or baz › "
    ]);
    assert.equal(input, "");
  });

  it("should render with validation error.", async() => {
    const logs: string[] = [];
    const options = {
      message: "Choose between foo, bar or baz",
      choices: ["foo", "bar", "baz"],
      autocomplete: true,
      validators: [required()]
    };
    const inputs = [
      { sequence: "X" },
      kInputs.return,
      { name: "backspace" },
      kInputs.return
    ];
    const selectPrompt = await TestingPrompt.SelectPrompt({
      ...options,
      inputs,
      onStdoutWrite: (log) => logs.push(log)
    });

    const input = await selectPrompt.select();

    assert.deepStrictEqual(logs, [
      "? Choose between foo, bar or baz",
      "› ",
      " › foo",
      "   bar",
      "   baz",
      // we press <X> so it filters no value
      "› X",
      // we press <return> so it re-render question with error
      "? Choose between foo, bar or baz [required]",
      "› X",
      // we press <backspace> so we get all choices
      // we press <enter> so it select 'foo'
      "› ",
      " › foo",
      "   bar",
      "   baz",
      // we press <return> so 'foo' is returned
      "✔ Choose between foo, bar or baz › foo"
    ]);
    assert.equal(input, "foo");
  });

  it("should return first choice when skipping prompt", async() => {
    const message = "Choose between foo, bar or baz";
    const options = {
      choices: ["foo", "bar", "baz"],
      skip: true
    };
    const input = await select(message, options);

    assert.equal(input, "foo");
  });
});
