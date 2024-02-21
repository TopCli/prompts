// Import Node.js Dependencies
import { EOL } from "node:os";

// Import Internal Dependencies
import { stripAnsi } from "../../src/utils.js";
import { AbstractPromptOptions } from "../../src/prompts/abstract.js";

export function mockProcess(inputs: string[] = [], writeCb: (value: string) => void = () => void 0) {
  const stdout = {
    write: (msg: string | Buffer) => {
      if (msg instanceof Buffer) {
        return;
      }

      const noAnsiMsg = stripAnsi(msg);
      if (noAnsiMsg) {
        writeCb(noAnsiMsg.replace(EOL, ""));
      }
    },
    moveCursor: () => true,
    clearScreenDown: () => true,
    clearLine: () => true
  };
  const stdin = {
    on: (event, cb) => {
      for (const input of inputs) {
        cb(null, input);
      }
    },
    off: () => true,
    pause: () => true,
    paused: () => false,
    resume: () => true,
    removeListener: () => true,
    listenerCount: () => true
  };

  return {
    stdout: stdout as unknown as AbstractPromptOptions["stdout"],
    stdin: stdin as unknown as AbstractPromptOptions["stdin"]
  };
}
