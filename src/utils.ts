// Import Node.js Dependencies
import process from "node:process";
import { stripVTControlCharacters } from "node:util";

// Import Internal Dependencies
import type { Separator } from "./types.ts";

export function isSeparator(choice: unknown): choice is Separator {
  return typeof choice === "object" && choice !== null && (choice as Separator).type === "separator";
}

// CONSTANTS
const kLenSegmenter = new Intl.Segmenter();

/**
 * @see https://github.com/sindresorhus/is-unicode-supported
 */
export function isUnicodeSupported() {
  if (process.platform !== "win32") {
    // Linux console (kernel)
    return process.env.TERM !== "linux";
  }

  // Windows Terminal
  return Boolean(process.env.WT_SESSION)
    // Terminus (<0.2.27)
    || Boolean(process.env.TERMINUS_SUBLIME)
    // ConEmu and cmder
    || process.env.ConEmuTask === "{cmd::Cmder}"
    || process.env.TERM_PROGRAM === "Terminus-Sublime"
    || process.env.TERM_PROGRAM === "vscode"
    || process.env.TERM === "xterm-256color"
    || process.env.TERM === "alacritty"
    || process.env.TERMINAL_EMULATOR === "JetBrains-JediTerm";
}

export function nextSelectableIndex(
  choices: unknown[],
  currentIndex: number,
  direction: "up" | "down"
): number {
  const length = choices.length;
  let index = currentIndex;
  for (let step = 0; step < length; step++) {
    if (direction === "up") {
      index = index === 0 ? length - 1 : index - 1;
    }
    else {
      index = index === length - 1 ? 0 : index + 1;
    }

    if (isSeparator(choices[index])) {
      continue;
    }

    return index;
  }

  return currentIndex;
}

export function stringLength(
  string: string
): number {
  if (string === "") {
    return 0;
  }

  let length = 0;
  for (const _ of kLenSegmenter.segment(
    stripVTControlCharacters(string)
  )) {
    length++;
  }

  return length;
}

