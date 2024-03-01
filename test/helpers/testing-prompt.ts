// Import Third-party Dependencies
import esmock from "esmock";

// Import Internal Dependencies
import { stripAnsi } from "../../src/utils.js";
import { QuestionOptions, SelectOptions, MultiselectOptions, ConfirmOptions } from "../../index.js";
import { mockProcess } from "./mock-process.js";

export type TestingPromptOptions = Partial<QuestionOptions &
  SelectOptions &
  MultiselectOptions &
  ConfirmOptions & {
  input: any;
  inputs: any[];
}> & {
  onStdoutWrite: (value: string) => void;
}

export class TestingPrompt {
  static async QuestionPrompt(message: string, options: TestingPromptOptions) {
    const { input, onStdoutWrite, defaultValue, validators, secure } = options;
    const inputs = Array.isArray(input) ? input : [input];

    const { QuestionPrompt } = await esmock("../../src/prompts/question", { }, {
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

    return new QuestionPrompt({ ...options, message, stdin, stdout, defaultValue, validators, secure });
  }

  static async SelectPrompt(message: string, options: TestingPromptOptions) {
    const { inputs = [], onStdoutWrite } = options;
    const { SelectPrompt } = await esmock("../../src/prompts/select", { }, {
      readline: {
        createInterface: () => {
          return {
            close: () => true
          };
        }
      }
    });
    const { stdin, stdout } = mockProcess(inputs, (data) => onStdoutWrite(data));

    return new SelectPrompt({ ...options, message, stdin, stdout });
  }

  static async MultiselectPrompt(message: string, options: TestingPromptOptions) {
    const { inputs = [], onStdoutWrite } = options;
    const { MultiselectPrompt } = await esmock("../../src/prompts/multiselect", { }, {
      readline: {
        createInterface: () => {
          return {
            close: () => true
          };
        }
      }
    });
    const { stdin, stdout } = mockProcess(inputs, (data) => onStdoutWrite(data));

    return new MultiselectPrompt({ ...options, message, stdin, stdout });
  }

  static async ConfirmPrompt(message: string, options: TestingPromptOptions) {
    const { inputs = [], initial, onStdoutWrite } = options;
    const { ConfirmPrompt } = await esmock("../../src/prompts/confirm", { }, {
      readline: {
        createInterface: () => {
          return {
            close: () => true
          };
        }
      }
    });
    const { stdin, stdout } = mockProcess(inputs, (data) => onStdoutWrite(data));

    return new ConfirmPrompt({ ...options, message, initial, stdin, stdout });
  }
}
