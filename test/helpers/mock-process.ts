// Import Node.js Dependencies
import { EOL } from "node:os";
import { stripVTControlCharacters } from "node:util";

// Import Internal Dependencies
import type { AbstractPromptOptions } from "../../src/prompts/abstract.ts";

type KeypressInput = {
  name: string;
  ctrl?: boolean;
};

export function mockProcess(inputs: any[] = [], writeCb: (value: string) => void = () => void 0) {
  let keypressCb: ((err: Error | null, data: KeypressInput) => void) | null = null;

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
    on: (_: any, cb: (err: Error | null, data: KeypressInput) => void) => {
      keypressCb = cb;
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

  function sendInput(input: KeypressInput) {
    keypressCb?.(null, input);
  }

  return {
    stdout: stdout as unknown as AbstractPromptOptions["stdout"],
    stdin: stdin as unknown as AbstractPromptOptions["stdin"],
    sendInput
  };
}
