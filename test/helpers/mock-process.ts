// Import Node.js Dependencies
import { EOL } from "node:os";

// Import Internal Dependencies
import { stripAnsi } from "../../src/utils.js";
import { SharedOptions } from "../../index.js";

export function mockProcess(inputs: string[], writeCb: (value: string) => void) {
  const stdout = {
    write: (msg: string) => {
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
    stdout: stdout as unknown as SharedOptions["stdout"],
    stdin: stdin as unknown as SharedOptions["stdin"]
  };
}
