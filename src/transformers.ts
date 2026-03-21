// Import Internal Dependencies
import type { PromptTransformer } from "./validators.ts";

export function number(): PromptTransformer<number> {
  return {
    transform(input) {
      if (input.trim() === "") {
        return { isValid: false, error: "not a number" };
      }

      const parsed = Number(input.replace(",", "."));
      if (Number.isNaN(parsed)) {
        return { isValid: false, error: "not a number" };
      }

      return { isValid: true, transformed: parsed };
    }
  };
}

export function integer(): PromptTransformer<number> {
  return {
    transform(input) {
      if (input.trim() === "") {
        return { isValid: false, error: "not an integer" };
      }

      const parsed = Number(input);
      if (Number.isNaN(parsed) || !Number.isInteger(parsed)) {
        return { isValid: false, error: "not an integer" };
      }

      return { isValid: true, transformed: parsed };
    }
  };
}

export function url(): PromptTransformer<URL> {
  return {
    transform(input) {
      try {
        return { isValid: true, transformed: new URL(input) };
      }
      catch {
        try {
          const parsed = new URL(`https://${input}`);
          // new URL() accepts any string as hostname (e.g. "https://foo" is valid).
          // For this use case, the user must explicitly type the protocol.
          if (!parsed.hostname.includes(".") && parsed.hostname !== "localhost") {
            return { isValid: false, error: "invalid URL" };
          }

          return { isValid: true, transformed: parsed };
        }
        catch {
          return { isValid: false, error: "invalid URL" };
        }
      }
    }
  };
}
