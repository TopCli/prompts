// Import Node.js Dependencies
import assert from "node:assert";
import { describe, it } from "node:test";

// Import Internal Dependencies
import { SelectPrompt } from "../src/prompts/select.js";
import { TestingPrompt } from "./helpers/testing-prompt.js";
import { mockProcess } from "./helpers/mock-process.js";
import { PromptAgent } from "../src/prompt-agent.js";
import { select } from "../index.js";

const kInputs = {
  down: { name: "down" },
  return: { name: "return" }
};
const kPromptAgent = PromptAgent.agent();

describe("SelectPrompt", () => {
  it("message should be required", () => {
    assert.throws(() => new SelectPrompt(12), {
      name: "TypeError",
      message: "message must be string, number given."
    });
  });

  it("Options should be required", () => {
    assert.throws(() => new SelectPrompt("foo"), {
      name: "TypeError",
      message: "Missing required options"
    });
  });

  it("choices should be required", () => {
    assert.throws(() => new SelectPrompt("foo", {}), {
      name: "TypeError",
      message: "Missing required param: choices"
    });
  });

  it("choice.label should be required", () => {
    assert.throws(() => new SelectPrompt("foo", {
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
    assert.throws(() => new SelectPrompt("foo", {
      choices: [{
        label: "foo",
        description: "bar"
      }]
    }), {
      name: "TypeError",
      message: "Missing value for choice {\"label\":\"foo\",\"description\":\"bar\"}"
    });
  });

  it("When press <return>, it should select the first choice.", async() => {
    const message = "Choose between foo & bar";
    const options = {
      choices: ["foo", "bar"]
    };
    const inputs = [kInputs.return];
    const logs = [];
    const selectPrompt = await TestingPrompt.SelectPrompt(
      message,
      {
        ...options,
        inputs: [kInputs.return],
        onStdoutWrite: (log) => logs.push(log)
      }
    );

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
    const logs = [];
    const message = "Choose between foo & bar";
    const options = {
      choices: ["foo", "bar"]
    };
    const inputs = [
      kInputs.down,
      kInputs.return
    ];
    const selectPrompt = await TestingPrompt.SelectPrompt(
      message,
      {
        ...options,
        inputs,
        onStdoutWrite: (log) => logs.push(log)
      }
    );

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
    const logs = [];
    const message = "Choose between foo & bar";
    const options = {
      choices: [
        { value: "foo", label: "foo" },
        { value: "bar", label: "bar" }
      ]
    };
    const selectPrompt = await TestingPrompt.SelectPrompt(
      message,
      {
        ...options,
        inputs: [kInputs.return],
        onStdoutWrite: (log) => logs.push(log)
      }
    );

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
      kInputs.return
    ];
    const selectPrompt = await TestingPrompt.SelectPrompt(
      message,
      {
        ...options,
        inputs,
        onStdoutWrite: (log) => logs.push(log)
      }
    );

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
      kInputs.down,
      kInputs.return
    ];
    const selectPrompt = await TestingPrompt.SelectPrompt(
      message,
      {
        ...options,
        inputs,
        onStdoutWrite: (log) => logs.push(log)
      }
    );

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
    const logs = [];
    const message = "Choose between foo & bar";
    const options = {
      choices: [
        { value: "foo", label: "foo" },
        { value: "bar", label: "bar" }
      ],
      ignoreValues: ["foo"]
    };
    const selectPrompt = await TestingPrompt.SelectPrompt(
      message,
      {
        ...options,
        inputs: [kInputs.return],
        onStdoutWrite: (log) => logs.push(log)
      }
    );

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
      kInputs.return
    ];
    const selectPrompt = await TestingPrompt.SelectPrompt(
      message,
      {
        ...options,
        inputs,
        onStdoutWrite: (log) => logs.push(log)
      }
    );

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
    const logs = [];
    const message = "Choose option";
    const options = {
      choices: [
        { value: "option1", label: "one", description: "foo" },
        { value: "option2", label: "Option 2", description: "foo" }
      ],
      maxVisible: 5
    };
    const selectPrompt = await TestingPrompt.SelectPrompt(
      message,
      {
        ...options,
        inputs: [kInputs.return],
        onStdoutWrite: (log) => logs.push(log)
      }
    );

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
    const selectPrompt = await TestingPrompt.SelectPrompt(
      message,
      {
        ...options,
        inputs: [kInputs.return],
        onStdoutWrite: (log) => logs.push(log)
      }
    );

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
    const input = await select("Choose option", { ...options, stdin, stdout });

    assert.equal(input, "option1");
    assert.deepStrictEqual(logs, [
      "✔ Choose option › option1"
    ]);
  });
});
