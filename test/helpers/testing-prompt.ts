// Import Node.js Dependencies
import { mock } from "node:test";
import readline from "node:readline";

// Import Internal Dependencies
import { stripAnsi } from "../../src/utils.js";
import { QuestionOptions, SelectOptions, MultiselectOptions, ConfirmOptions } from "../../index.js";
import { mockProcess } from "./mock-process.js";
import {
  ConfirmPrompt,
  MultiselectPrompt,
  QuestionPrompt,
  SelectPrompt
} from "../../src/prompts/index.js";

export type TestingPromptOptions<T> = T & {
  inputs: any[];
  onStdoutWrite: (value: string) => void;
};

export class TestingPrompt {
  static async QuestionPrompt(options: TestingPromptOptions<QuestionOptions>) {
    const { inputs, onStdoutWrite } = options;

    mock.method(readline, "createInterface", () => {
      return {
        question: (query, onInput) => {
          onInput(inputs.shift());
          onStdoutWrite(stripAnsi(query).trim());
        },
        close: () => true
      };
    });
    const { stdin, stdout } = mockProcess([], (data) => onStdoutWrite(data));

    return new QuestionPrompt({
      ...options,
      stdin,
      stdout
    });
  }

  static async SelectPrompt(options: TestingPromptOptions<SelectOptions>) {
    const { inputs = [], onStdoutWrite } = options;
    mock.method(readline, "createInterface", () => {
      return {
        close: () => true
      };
    });
    const { stdin, stdout } = mockProcess(inputs, (data) => onStdoutWrite(data));

    return new SelectPrompt({ ...options, stdin, stdout });
  }

  static async MultiselectPrompt(options: TestingPromptOptions<MultiselectOptions>) {
    const { inputs = [], onStdoutWrite } = options;
    mock.method(readline, "createInterface", () => {
      return {
        close: () => true
      };
    });
    const { stdin, stdout } = mockProcess(inputs, (data) => onStdoutWrite(data));

    return new MultiselectPrompt({ ...options, stdin, stdout });
  }

  static async ConfirmPrompt(options: TestingPromptOptions<ConfirmOptions>) {
    const { inputs = [], onStdoutWrite } = options;
    mock.method(readline, "createInterface", () => {
      return {
        close: () => true
      };
    });
    const { stdin, stdout } = mockProcess(inputs, (data) => onStdoutWrite(data));

    return new ConfirmPrompt({ ...options, stdin, stdout });
  }
}
