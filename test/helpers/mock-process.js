// Import Node.js Dependencies
import { EOL } from "node:os";

// Import Internal Dependencies
import { stripAnsi } from "../../src/utils.js";

export function mockProcess(inputs, writeCb) {
  const stdout = {
    write: (msg) => {
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

  return { stdout, stdin };
}
