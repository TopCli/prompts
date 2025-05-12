// Import Node.js Dependencies
import process from "node:process";
import { stripVTControlCharacters } from "node:util";

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
