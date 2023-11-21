// Import Node.js Dependencies
import { EOL } from "node:os";
import { createInterface } from "node:readline";
import { Writable } from "node:stream";

// Import Third-party Dependencies
import stripAnsi from "strip-ansi";

// Import Internal Dependencies
import { PromptAgent } from "../prompt-agent.js";

export class AbstractPrompt {
  constructor(message, input = process.stdin, output = process.stdout) {
    if (this.constructor === AbstractPrompt) {
      throw new Error("AbstractPrompt can't be instantiated.");
    }

    if (typeof message !== "string") {
      throw new TypeError(`message must be string, ${typeof message} given.`);
    }

    this.stdin = input;
    this.stdout = output;
    this.message = message;
    this.history = [];
    this.agent = PromptAgent.agent();
    this.mute = false;

    if (this.stdout.isTTY) {
      this.stdin.setRawMode(true);
    }
    this.rl = createInterface({
      input,
      output: new Writable({
        write: (chunk, encoding, callback) => {
          if (!this.mute) {
            this.stdout.write(chunk, encoding);
          }
          callback();
        }
      }),
      terminal: true
    });
  }

  write(data) {
    const formattedData = stripAnsi(data).replace(EOL, "");
    if (formattedData) {
      this.history.push(formattedData);
    }

    return this.stdout.write(data);
  }

  clearLastLine() {
    const lastLine = this.history.pop();
    if (!lastLine) {
      return;
    }

    const lastLineRows = Math.ceil(stripAnsi(lastLine).length / this.stdout.columns);

    this.stdout.moveCursor(-this.stdout.columns, -lastLineRows);
    this.stdout.clearScreenDown();
  }

  destroy() {
    this.rl.close();
  }
}
