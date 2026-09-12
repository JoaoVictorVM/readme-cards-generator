import { describe, expect, test } from "bun:test";
import { ELLIPSIS } from "@/lib/card/config";
import { characterBudget, truncateText } from "@/lib/card/truncate-text";

const LONG_NAME = "some-extremely-long-repository-name-here";

describe("characterBudget", () => {
  test("budget from width and ratio", () => {
    expect(characterBudget(268, 16, 0.6)).toBe(27);
    expect(characterBudget(168, 16, 0.6)).toBe(17);
    expect(characterBudget(152, 13, 0.52)).toBe(22);
  });
});

describe("truncateText", () => {
  test("string within budget is unchanged", () => {
    expect(truncateText("next.js", 17)).toBe("next.js");
  });

  test("string at budget is unchanged", () => {
    const exact = "a".repeat(27);
    expect(truncateText(exact, 27)).toBe(exact);
  });

  test("string over budget is cut with ellipsis", () => {
    const result = truncateText(LONG_NAME, 27);
    expect(result).toBe("some-extremely-long-reposi…");
    expect(Array.from(result)).toHaveLength(27);
    expect(result.endsWith(ELLIPSIS)).toBe(true);
    expect(truncateText(LONG_NAME, 17)).toBe("some-extremely-l…");
  });

  test("ellipsis counts as one character", () => {
    for (const budget of [2, 5, 10, 26]) {
      expect(Array.from(truncateText(LONG_NAME, budget))).toHaveLength(budget);
    }
  });

  test("budget below two yields ellipsis only", () => {
    expect(truncateText(LONG_NAME, 1)).toBe(ELLIPSIS);
    expect(truncateText(LONG_NAME, 0)).toBe(ELLIPSIS);
    expect(truncateText(LONG_NAME, -3)).toBe(ELLIPSIS);
  });

  test("multibyte characters count once", () => {
    const astral = "🚀🚀🚀🚀🚀";
    expect(truncateText(astral, 5)).toBe(astral);
    const cut = truncateText(astral, 3);
    expect(cut).toBe("🚀🚀…");
    expect(Array.from(cut)).toHaveLength(3);
  });
});
