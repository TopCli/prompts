// Import Third-party Dependencies
import { expectType } from "tsd";

// Import Internal Dependencies
import {
  question,
  confirm,
  select,
  multiselect,
  type PromptValidator
} from "../../src/index.ts";

const stringNotEmptyValidator: PromptValidator<string> = {
  validate(input) {
    return input.trim().length === 0 ?
      { isValid: false, error: "Input was empty" } :
      { isValid: true };
  }
};

expectType<Promise<string>>(
  question("message", {
    validators: [stringNotEmptyValidator]
  })
);

expectType<Promise<"A" | "B">>(
  select("message", { choices: ["A", "B"] })
);
expectType<Promise<"A" | "B">>(
  select("message", {
    choices: [
      { value: "A", label: "Option A" },
      { value: "B", label: "Option B" }
    ]
  })
);

expectType<Promise<("A" | "B")[]>>(
  multiselect("message", { choices: ["A", "B"] })
);
expectType<Promise<("A" | "B")[]>>(
  multiselect("message", {
    choices: [
      { value: "A", label: "Option A" },
      { value: "B", label: "Option B" }
    ],
    preSelectedChoices: ["A"]
  })
);

expectType<Promise<boolean>>(
  confirm("message")
);
expectType<Promise<boolean>>(
  confirm("message", { initial: true })
);
