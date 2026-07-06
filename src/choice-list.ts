// Import Internal Dependencies
import { ChoiceVO } from "./choice-vo.ts";
import type { Choice, Separator } from "./types.ts";
import { isSeparator } from "./utils.ts";

// CONSTANTS
const kRequiredChoiceProperties = ["label", "value"];

export type ChoiceListItem<T extends string> = ChoiceVO<T> | Separator;

export class ChoiceList<T extends string> {
  #items: ChoiceListItem<T>[];

  private constructor(
    items: ChoiceListItem<T>[]
  ) {
    this.#items = items;
  }

  static from<T extends string>(
    rawChoices: (Choice<T> | T | Separator)[]
  ): ChoiceList<T> {
    const items = rawChoices.map((raw) => {
      if (isSeparator(raw)) {
        return raw;
      }
      if (typeof raw !== "string") {
        for (const prop of kRequiredChoiceProperties) {
          if (!raw[prop]) {
            throw new TypeError(`Missing ${prop} for choice ${JSON.stringify(raw)}`);
          }
        }
      }

      return new ChoiceVO<T>(raw);
    });

    if (items.every((item) => isSeparator(item))) {
      throw new TypeError("choices must contain at least one non-separator item");
    }

    return new ChoiceList<T>(items);
  }

  get length(): number {
    return this.#items.length;
  }

  at(index: number): ChoiceListItem<T> | undefined {
    return this.#items[index];
  }

  [Symbol.iterator](): Iterator<ChoiceListItem<T>> {
    return this.#items[Symbol.iterator]();
  }

  filtered(
    query: string,
    caseSensitive = false
  ): ChoiceList<T> {
    return new ChoiceList<T>(
      this.#items.filter((item) => !isSeparator(item) && item.matches(query, caseSensitive))
    );
  }

  nextEnabledIndex(
    from: number,
    direction: 1 | -1
  ): number {
    const total = this.#items.length;
    if (total === 0) {
      return from;
    }

    let index = (from + direction + total) % total;
    while (index !== from) {
      const item = this.#items[index];
      if (!isSeparator(item) && !item.disabled) {
        return index;
      }
      index = (index + direction + total) % total;
    }

    return from;
  }

  firstEnabledIndex(): number {
    const index = this.#items.findIndex((item) => !isSeparator(item) && !item.disabled);

    return index === -1 ? 0 : index;
  }

  visibleRange(
    activeIndex: number,
    maxVisible: number
  ): { startIndex: number; endIndex: number; } {
    let startIndex = Math.min(this.#items.length - maxVisible, activeIndex - Math.floor(maxVisible / 2));
    if (startIndex < 0) {
      startIndex = 0;
    }
    const endIndex = Math.min(startIndex + maxVisible, this.#items.length);

    return { startIndex, endIndex };
  }

  get longestLabelLength(): number {
    const selectableChoices = this.#items.filter((item): item is ChoiceVO<T> => !isSeparator(item));
    if (selectableChoices.length === 0) {
      return 0;
    }

    return Math.max(...selectableChoices.map((choice) => choice.label.length));
  }

  indexOf(value: T): number {
    return this.#items.findIndex((item) => !isSeparator(item) && item.value === value);
  }
}
