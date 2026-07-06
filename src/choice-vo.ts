// Import Internal Dependencies
import type { Choice } from "./types.ts";

export class ChoiceVO<T extends string> {
  value: T;
  label: string;
  description?: string;
  disabled: boolean;
  disabledReason: string | undefined;

  constructor(
    raw: Choice<T> | T
  ) {
    if (typeof raw === "string") {
      this.value = raw;
      this.label = raw;
      this.disabled = false;
      this.disabledReason = undefined;
    }
    else {
      this.value = raw.value;
      this.label = raw.label;
      this.description = raw.description;
      this.disabled = Boolean(raw.disabled);
      this.disabledReason = typeof raw.disabled === "string" ? raw.disabled : undefined;
    }
  }

  matches(
    query: string,
    caseSensitive = false
  ): boolean {
    const label = caseSensitive ? this.label : this.label.toLowerCase();
    const normalizedQuery = caseSensitive ? query : query.toLowerCase();

    if (normalizedQuery.includes(" ")) {
      return normalizedQuery.split(" ").every(
        (word) => label.includes(word) || label.includes(normalizedQuery)
      );
    }

    return label.includes(normalizedQuery);
  }

  get descriptionSuffix(): string {
    return this.description ? ` - ${this.description}` : "";
  }

  get disabledHint(): string {
    return this.disabled && this.disabledReason ? ` [${this.disabledReason}]` : "";
  }
}
