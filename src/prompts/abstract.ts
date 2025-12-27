// Import Node.js Dependencies
import { EOL } from "node:os";
import readline from "node:readline";
import { Writable } from "node:stream";
import EventEmitter from "node:events";
import { stripVTControlCharacters } from "node:util";

// Import Internal Dependencies
import { PromptAgent } from "../prompt-agent.ts";
import { AbortError } from "../errors/abort.ts";

// CONSTANTS
function kNoopTransformer(input: Buffer) {
  return input;
}

type Stdin = NodeJS.ReadStream & {
  fd: 0;
};

type Stdout = NodeJS.WriteStream & {
  fd: 1;
};

export interface AbstractPromptOptions {
  stdin?: Stdin;
  stdout?: Stdout;
  message: string;
  skip?: boolean;
  signal?: AbortSignal;
}

export class AbstractPrompt<T extends string | boolean> extends EventEmitter {
  stdin: Stdin;
  stdout: Stdout;
  message: string;
  signal?: AbortSignal;
  skip: boolean;
  history: string[];
  agent: PromptAgent<T>;
  transformer: (input: Buffer) => Buffer | null = kNoopTransformer;
  rl: readline.Interface;
  #signalHandler: () => void;

  constructor(options: AbstractPromptOptions) {
    super();

    if (this.constructor === AbstractPrompt) {
      throw new Error("AbstractPrompt can't be instantiated.");
    }

    const {
      stdin: input = process.stdin,
      stdout: output = process.stdout,
      message,
      signal,
      skip = false
    } = options;

    if (typeof message !== "string") {
      throw new TypeError(`message must be string, ${typeof message} given.`);
    }

    if (!output.isTTY) {
      // when process.stdout is not TTY (i.e within IDEs) theses methods does not exists and make the lib crashing
      Object.assign(output, {
        moveCursor: () => void 0,
        clearScreenDown: () => void 0
      });
    }

    this.stdin = input;
    this.stdout = output;
    this.message = message;
    this.signal = signal;
    this.skip = skip;
    this.history = [];
    this.agent = PromptAgent.agent<T>();

    if (this.stdout.isTTY) {
      this.stdin.setRawMode(true);
    }

    this.rl = readline.createInterface({
      input,
      output: new Writable({
        write: (chunk: Buffer | string, encoding: BufferEncoding, callback) => {
          if (chunk) {
            const transformed = this.transformer(
              Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
            );
            if (transformed !== null) {
              this.stdout.write(transformed, encoding);
            }
          }
          callback();
        }
      }),
      terminal: true
    });

    if (this.signal) {
      this.#signalHandler = () => {
        this.rl.close();
        for (let i = 0; i < this.history.length; i++) {
          this.clearLastLine();
        }
        this.emit("error", new AbortError("Prompt aborted"));
      };

      if (this.signal.aborted) {
        this.#signalHandler();
      }
      this.signal.addEventListener("abort", this.#signalHandler, { once: true });
    }
  }

  reset() {
    this.transformer = kNoopTransformer;
  }

  write(data: string) {
    const formattedData = stripVTControlCharacters(data).replace(EOL, "");
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

    const lastLineRows = Math.ceil(stripVTControlCharacters(lastLine).length / this.stdout.columns);

    this.stdout.moveCursor(-this.stdout.columns, -lastLineRows);
    this.stdout.clearScreenDown();
  }

  destroy() {
    this.rl.close();

    if (this.signal) {
      this.signal.removeEventListener("abort", this.#signalHandler);
    }
  }
}
