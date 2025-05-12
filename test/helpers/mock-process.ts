// Import Node.js Dependencies
import { EOL } from "node:os";
import { stripVTControlCharacters } from "node:util";

// Import Internal Dependencies
import { AbstractPromptOptions } from "../../src/prompts/abstract.js";

export function mockProcess(inputs: string[] = [], writeCb: (value: string) => void = () => void 0) {
  const stdout = {
    write: (msg: string | Buffer) => {
      if (typeof msg === "object") {
        return;
      }

      const noAnsiMsg = stripVTControlCharacters(msg);
      if (noAnsiMsg) {
        writeCb(noAnsiMsg.replace(EOL, ""));
      }
    },
    moveCursor: () => true,
    clearScreenDown: () => true,
    clearLine: () => true
  };
  const stdin = {
    on: (_event, cb) => {
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
