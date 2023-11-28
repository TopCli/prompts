// Import Third-party Dependencies
import kleur from "kleur";

// Import Internal Dependencies
import { isUnicodeSupported } from "./utils.js";

const kMainSymbols = {
  tick: "✔",
  cross: "✖",
  pointer: "›",
  previous: "⭡",
  next: "⭣",
  active: "●",
  inactive: "○"
};
const kFallbackSymbols = {
  tick: "√",
  cross: "×",
  pointer: ">",
  previous: "↑",
  next: "↓",
  active: "(+)",
  inactive: "(-)"
};
const kSymbols = isUnicodeSupported() || process.env.CI ? kMainSymbols : kFallbackSymbols;
const kPointer = kleur.gray(kSymbols.pointer);

export const SYMBOLS = {
  QuestionMark: kleur.blue().bold("?"),
  Tick: kleur.green().bold(kSymbols.tick),
  Cross: kleur.red().bold(kSymbols.cross),
  Pointer: kPointer,
  Previous: kSymbols.previous,
  Next: kSymbols.next,
  ShowCursor: "\x1B[?25h",
  HideCursor: "\x1B[?25l",
  Active: kleur.cyan(kSymbols.active),
  Inactive: kleur.gray(kSymbols.inactive)
};
