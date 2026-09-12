import { describe, expect, test } from "bun:test";
import { CARD_HEIGHT } from "@/lib/card/config";
import { computeLayout } from "@/lib/card/layout";

const WIDTHS = [280, 380, 600] as const;

describe("computeLayout", () => {
  test("vertical coordinates are width independent", () => {
    const reference = computeLayout(380);
    for (const width of WIDTHS) {
      const layout = computeLayout(width);
      expect(layout.tile.y).toBe(reference.tile.y);
      expect(layout.icon.y).toBe(reference.icon.y);
      expect(layout.name.y).toBe(reference.name.y);
      expect(layout.dot.cy).toBe(reference.dot.cy);
      expect(layout.activity.y).toBe(reference.activity.y);
      expect(layout.button.y).toBe(reference.button.y);
      expect(layout.button.labelY).toBe(reference.button.labelY);
      expect(layout.errorGlyph.y).toBe(reference.errorGlyph.y);
      expect(layout.errorMessage.y).toBe(reference.errorMessage.y);
      expect(layout.height).toBe(CARD_HEIGHT);
    }
  });

  test("tile geometry is constant", () => {
    for (const width of WIDTHS) {
      const { tile, icon } = computeLayout(width);
      expect(tile).toEqual({ x: 20, y: 20, size: 56, rx: 14 });
      expect(icon).toEqual({ x: 32, y: 32 });
    }
  });

  test("button spans width minus padding", () => {
    for (const width of WIDTHS) {
      const { button } = computeLayout(width);
      expect(button.x).toBe(20);
      expect(button.width).toBe(width - 40);
      expect(button.labelX).toBe(width / 2);
    }
  });

  test("name budget tracks width", () => {
    expect(computeLayout(280).name.budgetPx).toBe(168);
    expect(computeLayout(380).name.budgetPx).toBe(268);
    expect(computeLayout(600).name.budgetPx).toBe(488);
    expect(computeLayout(280).name.budgetChars).toBe(17);
    expect(computeLayout(380).name.budgetChars).toBe(27);
    expect(computeLayout(600).name.budgetChars).toBe(50);
  });

  test("secondary budgets match the spec fixtures", () => {
    expect(computeLayout(280).activity.budgetChars).toBe(22);
    expect(computeLayout(280).errorMessage.budgetChars).toBe(30);
    expect(computeLayout(380).errorMessage.budgetChars).toBe(44);
  });

  test("button is bottom pinned", () => {
    for (const width of WIDTHS) {
      const { button } = computeLayout(width);
      expect(button.y + button.height).toBe(130);
      expect(CARD_HEIGHT - (button.y + button.height)).toBe(20);
    }
  });

  test("text positions match the spec", () => {
    const layout = computeLayout(380);
    expect(layout.name).toMatchObject({ x: 92, y: 42 });
    expect(layout.dot).toEqual({ cx: 97, cy: 62, r: 5 });
    expect(layout.activity).toMatchObject({ x: 108, y: 66 });
    expect(layout.errorGlyph).toEqual({ x: 20, y: 63 });
    expect(layout.errorMessage).toMatchObject({ x: 56, y: 80 });
    expect(layout.background).toEqual({
      x: 0.5,
      y: 0.5,
      width: 379,
      height: 149,
      rx: 12,
    });
  });
});
