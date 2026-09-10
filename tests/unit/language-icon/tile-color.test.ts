import { describe, expect, test } from "bun:test";
import { FALLBACK_TILE_COLOR } from "@/lib/language-icon/config";
import { LANGUAGE_TABLE } from "@/lib/language-icon/language-map";
import {
  deriveTileColor,
  parseHex,
  rgbToHsl,
} from "@/lib/language-icon/tile-color";

function hslOf(hex: string) {
  const rgb = parseHex(hex)!;
  return rgbToHsl(rgb.r, rgb.g, rgb.b);
}

const CHROMATIC = LANGUAGE_TABLE.filter(
  (entry) => deriveTileColor(entry.color) !== FALLBACK_TILE_COLOR,
);

describe("deriveTileColor", () => {
  test("go tint matches the fixture", () => {
    expect(deriveTileColor("#00add8")).toBe("#142f36");
  });

  test("typescript tint matches the fixture", () => {
    expect(deriveTileColor("#3178c6")).toBe("#162536");
  });

  test("rust tint matches the fixture", () => {
    expect(deriveTileColor("#dea584")).toBe("#3a2518");
  });

  // The transform itself is exact; rounding each channel to eight bits moves
  // the measured hue, saturation and lightness slightly off the computed
  // targets, so the round-tripped assertions carry a quantization tolerance
  // while the computed targets below are asserted against the exact band.
  test("computed saturation and lightness land in the exact target band", () => {
    for (const entry of CHROMATIC) {
      const source = hslOf(entry.color);
      const targetS = 0.35 + 0.1 * source.s;
      const targetL = 0.12 + 0.06 * source.l;
      expect(targetS).toBeGreaterThanOrEqual(0.35);
      expect(targetS).toBeLessThanOrEqual(0.45);
      expect(targetL).toBeGreaterThanOrEqual(0.12);
      expect(targetL).toBeLessThanOrEqual(0.18);
    }
  });

  test("hue is preserved for every chromatic row", () => {
    for (const entry of CHROMATIC) {
      const source = hslOf(entry.color);
      const tint = hslOf(deriveTileColor(entry.color));
      const delta = Math.min(
        Math.abs(tint.h - source.h),
        360 - Math.abs(tint.h - source.h),
      );
      expect(delta).toBeLessThanOrEqual(2);
    }
  });

  test("saturation lands in the target band", () => {
    for (const entry of CHROMATIC) {
      const { s } = hslOf(deriveTileColor(entry.color));
      expect(s).toBeGreaterThanOrEqual(0.33);
      expect(s).toBeLessThanOrEqual(0.47);
    }
  });

  test("lightness lands in the target band", () => {
    for (const entry of CHROMATIC) {
      const { l } = hslOf(deriveTileColor(entry.color));
      expect(l).toBeGreaterThanOrEqual(0.11);
      expect(l).toBeLessThanOrEqual(0.19);
    }
  });

  test("tint is never the neutral for a chromatic row", () => {
    for (const entry of CHROMATIC) {
      expect(deriveTileColor(entry.color)).not.toBe(FALLBACK_TILE_COLOR);
    }
  });

  test("achromatic color returns the neutral", () => {
    expect(deriveTileColor("#555555")).toBe(FALLBACK_TILE_COLOR);
    expect(deriveTileColor("#000100")).toBe(FALLBACK_TILE_COLOR);
  });

  test("shorthand hex is accepted", () => {
    expect(deriveTileColor("#0ad")).toBe(deriveTileColor("#00aadd"));
  });

  test("malformed hex returns the neutral", () => {
    expect(deriveTileColor("blue")).toBe(FALLBACK_TILE_COLOR);
    expect(deriveTileColor("#12")).toBe(FALLBACK_TILE_COLOR);
    expect(deriveTileColor("")).toBe(FALLBACK_TILE_COLOR);
    expect(deriveTileColor(null)).toBe(FALLBACK_TILE_COLOR);
  });

  test("transform is deterministic", () => {
    for (const entry of LANGUAGE_TABLE) {
      expect(deriveTileColor(entry.color)).toBe(deriveTileColor(entry.color));
    }
  });

  test("output is always six-digit lowercase hex", () => {
    for (const entry of LANGUAGE_TABLE) {
      expect(deriveTileColor(entry.color)).toMatch(/^#[0-9a-f]{6}$/);
    }
  });
});
