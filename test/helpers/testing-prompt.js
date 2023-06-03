// Import Third-party Dependencies
import stripAnsi from "strip-ansi";
import esmock from "esmock";

// Import Internal Dependencies
import { mockProcess } from "./mock-process.js";

export class TestingPrompt {
  static async QuestionPrompt(message, options) {
    const { input, onStdoutWrite, validators } = options;
    const inputs = Array.isArray(input) ? input : [input];

    const { QuestionPrompt } = await esmock("../../src/question-prompt", { }, {
      readline: {
        createInterface: () => {
          return {
            question: (query, onInput) => {
              onInput(inputs.shift());
              onStdoutWrite(stripAnsi(query).trim());
            },
            close: () => true
          };
        }
      }
    });
    const { stdin, stdout } = mockProcess([], (data) => onStdoutWrite(data));

    return new QuestionPrompt(message, { stdin, stdout, validators });
  }

  static async SelectPrompt(message, options) {
    const { inputs, onStdoutWrite } = options;
    const { SelectPrompt } = await esmock("../../src/select-prompt", { }, {
      readline: {
        createInterface: () => {
          return {
            close: () => true
          };
        }
      }
    });
    const { stdin, stdout } = mockProcess(inputs, (data) => onStdoutWrite(data));

    return new SelectPrompt(message, { ...options, stdin, stdout });
  }

  static async ConfirmPrompt(message, options) {
    const { input, initial, onStdoutWrite } = options;
    const { ConfirmPrompt } = await esmock("../../src/confirm-prompt", { }, {
      readline: {
        createInterface: () => {
          return {
            question: (query, onInput) => {
              onInput(input);
              onStdoutWrite(stripAnsi(query).trim());
            },
            close: () => true
          };
        }
      }
    });
    const { stdin, stdout } = mockProcess(input, (data) => onStdoutWrite(data));

    return new ConfirmPrompt(message, { initial, stdin, stdout });
  }
}
