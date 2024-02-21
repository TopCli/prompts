// Import Node.js Dependencies
import { EOL } from "node:os";
import { Interface, createInterface } from "node:readline";
import { Writable } from "node:stream";

// Import Internal Dependencies
import { stripAnsi } from "../utils.js";
import { PromptAgent } from "../prompt-agent.js";
import { TimeoutError } from "../errors/timeout.js";
import EventEmitter from "node:events";

type Stdin = NodeJS.ReadStream & {
  fd: 0;
};

type Stdout = NodeJS.WriteStream & {
  fd: 1;
}

export interface AbstractPromptOptions {
  stdin?: Stdin;
  stdout?: Stdout;
  message: string;
  timeout?: number;
}

export class AbstractPrompt<T> extends EventEmitter {
  stdin: Stdin;
  stdout: Stdout;
  message: string;
  history: string[];
  agent: PromptAgent<T>;
  mute: boolean;
  rl: Interface;
  #timeoutHandler: NodeJS.Timeout;

  constructor(options: AbstractPromptOptions) {
    super();

    if (this.constructor === AbstractPrompt) {
      throw new Error("AbstractPrompt can't be instantiated.");
    }

    const {
      stdin: input = process.stdin,
      stdout: output = process.stdout,
      message,
      timeout
    } = options;

    if (typeof message !== "string") {
      throw new TypeError(`message must be string, ${typeof message} given.`);
    }

    this.stdin = input;
    this.stdout = output;
    this.message = message;
    this.history = [];
    this.agent = PromptAgent.agent<T>();
    this.mute = false;

    if (this.stdout.isTTY) {
      this.stdin.setRawMode(true);
    }

    this.rl = createInterface({
      input,
      output: new Writable({
        write: (chunk: string, encoding: BufferEncoding, callback) => {
          if (!this.mute && chunk) {
            this.stdout.write(chunk, encoding);
          }
          callback();
        }
      }),
      terminal: true
    });

    if (timeout) {
      if (typeof timeout !== "number") {
        throw new TypeError(`timeout must be a number, ${typeof timeout} given.`);
      }
      else if (timeout < 0) {
        throw new Error(`timeout must be a positive number, ${timeout} given.`);
      }

      this.#timeoutHandler = setTimeout(() => {
        this.rl.close();
        for (let i = 0; i < this.history.length; i++) {
          this.clearLastLine();
        }
        this.emit("error", new TimeoutError("Prompt timeout reached"));
      }, timeout);
    }
  }

  write(data: string) {
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

    if (this.#timeoutHandler) {
      clearTimeout(this.#timeoutHandler);
    }
  }
}
