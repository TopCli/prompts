// Import Node.js Dependencies
import assert from "node:assert";
import { describe, it } from "node:test";

// Import Internal Dependencies
import { transformers } from "../src/index.ts";
import {
  isValidTransformation,
  type TransformationResponse,
  type ValidTransformationResponse
} from "./../src/validators.ts";

function assertValidTransformation<T>(
  result: TransformationResponse<T> | Promise<TransformationResponse<T>>
): asserts result is ValidTransformationResponse<T> {
  assert.ok(
    !(result instanceof Promise) && isValidTransformation(result),
    "expected a valid synchronous transformation"
  );
}

describe("transformers.number()", () => {
  it("should return an error for a non-numeric string", () => {
    const result = transformers.number().transform("foo");
    assert.deepStrictEqual(result, { isValid: false, error: "not a number" });
  });

  it("should return an error for an empty string", () => {
    const result = transformers.number().transform("");
    assert.deepStrictEqual(result, { isValid: false, error: "not a number" });
  });

  it("should transform a valid integer string", () => {
    const result = transformers.number().transform("42");
    assert.deepStrictEqual(result, { isValid: true, transformed: 42 });
  });

  it("should transform a valid float string (dot)", () => {
    const result = transformers.number().transform("3.14");
    assert.deepStrictEqual(result, { isValid: true, transformed: 3.14 });
  });

  it("should transform a valid float string (coma)", () => {
    const result = transformers.number().transform("3,14");
    assert.deepStrictEqual(result, { isValid: true, transformed: 3.14 });
  });

  it("should transform a negative number string", () => {
    const result = transformers.number().transform("-7");
    assert.deepStrictEqual(result, { isValid: true, transformed: -7 });
  });
});

describe("transformers.integer()", () => {
  it("should return an error for a non-numeric string", () => {
    const result = transformers.integer().transform("foo");
    assert.deepStrictEqual(result, { isValid: false, error: "not an integer" });
  });

  it("should return an error for an empty string", () => {
    const result = transformers.integer().transform("");
    assert.deepStrictEqual(result, { isValid: false, error: "not an integer" });
  });

  it("should return an error for a float string", () => {
    const result = transformers.integer().transform("3.14");
    assert.deepStrictEqual(result, { isValid: false, error: "not an integer" });
  });

  it("should transform a valid integer string", () => {
    const result = transformers.integer().transform("42");
    assert.deepStrictEqual(result, { isValid: true, transformed: 42 });
  });

  it("should transform a negative integer string", () => {
    const result = transformers.integer().transform("-7");
    assert.deepStrictEqual(result, { isValid: true, transformed: -7 });
  });
});

describe("transformers.url()", () => {
  it("should return an error for a plain string", () => {
    const result = transformers.url().transform("not-a-url");
    assert.deepStrictEqual(result, { isValid: false, error: "invalid URL" });
  });

  it("should return an error for an empty string", () => {
    const result = transformers.url().transform("");
    assert.deepStrictEqual(result, { isValid: false, error: "invalid URL" });
  });

  it("should transform a valid http URL", () => {
    const result = transformers.url().transform("https://example.com");
    assertValidTransformation(result);
    assert.ok(result.transformed instanceof URL);
    assert.strictEqual(result.transformed.href, "https://example.com/");
  });

  it("should transform a URL with path and query", () => {
    const result = transformers.url().transform("https://example.com/path?foo=bar");
    assertValidTransformation(result);
    assert.ok(result.transformed instanceof URL);
    assert.strictEqual(result.transformed.pathname, "/path");
    assert.strictEqual(result.transformed.searchParams.get("foo"), "bar");
  });

  it("should prepend https:// when protocol is missing", () => {
    const result = transformers.url().transform("example.com");
    assertValidTransformation(result);
    assert.ok(result.transformed instanceof URL);
    assert.strictEqual(result.transformed.href, "https://example.com/");
  });
});
