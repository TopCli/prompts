// Import Third-party Dependencies
import stripAnsi from "strip-ansi";
import esmock from "esmock";

// Import Internal Dependencies
import { mockProcess } from "./mock-process.js";

export class TestingPrompt {
  static async TextPrompt(message, input, onStdoutWriteCallback) {
    const { TextPrompt } = await esmock("../../src/text-prompt", { }, {
      readline: {
        createInterface: () => {
          return {
            question: (query, onInput) => {
              onInput(input);
              onStdoutWriteCallback(stripAnsi(query).trim());
            },
            close: () => true
          };
        }
      }
    });
    const { stdin, stdout } = mockProcess([], (data) => onStdoutWriteCallback(data));

    return new TextPrompt(message, stdin, stdout);
  }

  // eslint-disable-next-line max-params
  static async SelectPrompt(message, options, input, onStdoutWriteCallback) {
    const { SelectPrompt } = await esmock("../../src/select-prompt", { }, {
      readline: {
        createInterface: () => {
          return {
            close: () => true
          };
        }
      }
    });
    const { stdin, stdout } = mockProcess(input, (data) => onStdoutWriteCallback(data));

    return new SelectPrompt(message, options, stdin, stdout);
  }

  // eslint-disable-next-line max-params
  static async ConfirmPrompt(message, input, onStdoutWriteCallback, initial) {
    const { ConfirmPrompt } = await esmock("../../src/confirm-prompt", { }, {
      readline: {
        createInterface: () => {
          return {
            question: (query, onInput) => {
              onInput(input);
              onStdoutWriteCallback(stripAnsi(query).trim());
            },
            close: () => true
          };
        }
      }
    });
    const { stdin, stdout } = mockProcess(input, (data) => onStdoutWriteCallback(data));
    const options = typeof initial === "boolean" ? { initial } : {};

    return new ConfirmPrompt(message, options, stdin, stdout);
  }
}
