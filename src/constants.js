// Import Third-party Dependencies
import kleur from "kleur";
import isUnicodeSupported from "is-unicode-supported";

const kMainSymbols = {
  tick: "✔",
  cross: "✖",
  pointer: "›",
  previous: "⭡",
  next: "⭣"
};
const kFallbackSymbols = {
  tick: "√",
  cross: "×",
  pointer: ">",
  previous: "↑",
  next: "↓"
};
const kSymbols = isUnicodeSupported() ? kMainSymbols : kFallbackSymbols;
const kPointer = kleur.gray(kSymbols.pointer);

export const SYMBOLS = {
  QuestionMark: kleur.blue().bold("?"),
  Tick: kleur.green().bold(kSymbols.tick),
  Cross: kleur.red().bold(kSymbols.cross),
  Pointer: kPointer,
  Previous: kSymbols.previous,
  Next: kSymbols.next,
  ShowCursor: "\x1B[?25h",
  HideCursor: "\x1B[?25l"
};
