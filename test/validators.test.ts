// Import Node.js Dependencies
import assert from "node:assert";
import { describe, it } from "node:test";

// Import Internal Dependencies
import {
  InvalidResponseObject,
  isValid,
  resultError,
  ValidationResponseObject
} from "../src/validators.js";

describe("Validators", () => {
  describe("isValid", () => {
    const testCases = [
      {
        input: "test",
        expected: true
      },
      {
        input: "",
        expected: false
      },
      {
        input: null,
        expected: true
      },
      {
        input: undefined,
        expected: true
      },
      {
        input: { isValid: true } as ValidationResponseObject,
        expected: true
      },
      {
        input: { isValid: false, error: "boo" } as ValidationResponseObject,
        expected: false
      }
    ];

    for (const testCase of testCases) {
      it(`given '${formatInput(testCase.input)}', it should return ${testCase.expected}`, () => {
        assert.strictEqual(isValid(testCase.input), testCase.expected);
      });
    }
  });

  describe("resultError", () => {
    it("should return the error message given an object", () => {
      const error = "required";
      const result: InvalidResponseObject = { isValid: false, error };

      assert.strictEqual(resultError(result), error);
    });

    it("should return the error message given a string", () => {
      const error = "required";

      assert.strictEqual(resultError(error), error);
    });
  });
});

function formatInput(input: unknown): string {
  if (typeof input === "object") {
    return JSON.stringify(input);
  }

  return String(input);
}
