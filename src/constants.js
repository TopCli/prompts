// Import Third-party Dependencies
import kleur from "kleur";
import isUnicodeSupported from "is-unicode-supported";
import isCI from "is-ci";

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
const kSymbols = isUnicodeSupported() || isCI ? kMainSymbols : kFallbackSymbols;
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
