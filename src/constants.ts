// Import Node.js Dependencies
import { styleText } from "node:util";

// Import Internal Dependencies
import { isUnicodeSupported } from "./utils.ts";

const kMainSymbols = {
  tick: "✔",
  cross: "✖",
  pointer: "›",
  previous: "⭡",
  next: "⭣",
  active: "●",
  inactive: "○",
  separator: "─"
};
const kFallbackSymbols = {
  tick: "√",
  cross: "×",
  pointer: ">",
  previous: "↑",
  next: "↓",
  active: "(+)",
  inactive: "(-)",
  separator: "-"
};
const kSymbols = isUnicodeSupported() || process.env.CI ? kMainSymbols : kFallbackSymbols;
const kPointer = styleText("gray", kSymbols.pointer);

export const SYMBOLS = {
  QuestionMark: styleText(["blue", "bold"], "?"),
  Tick: styleText(["green", "bold"], kSymbols.tick),
  Cross: styleText(["red", "bold"], kSymbols.cross),
  Pointer: kPointer,
  Previous: kSymbols.previous,
  Next: kSymbols.next,
  ShowCursor: "\x1B[?25h",
  HideCursor: "\x1B[?25l",
  Active: styleText("cyan", kSymbols.active),
  Inactive: styleText("gray", kSymbols.inactive),
  SeparatorLine: kSymbols.separator
};

export const VALIDATION_SPINNER_INTERVAL = 300;
