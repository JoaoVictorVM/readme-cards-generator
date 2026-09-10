import {
  FALLBACK_TILE_COLOR,
  TILE_ACHROMATIC_CHROMA,
  TILE_ACHROMATIC_THRESHOLD,
  TILE_LIGHTNESS_BASE,
  TILE_LIGHTNESS_FACTOR,
  TILE_SATURATION_BASE,
  TILE_SATURATION_FACTOR,
} from "@/lib/language-icon/config";

export type Hsl = { h: number; s: number; l: number };

function chroma(r: number, g: number, b: number): number {
  return (Math.max(r, g, b) - Math.min(r, g, b)) / 255;
}

const HEX_LONG = /^#[0-9a-f]{6}$/;
const HEX_SHORT = /^#[0-9a-f]{3}$/;

export function parseHex(
  value: string | null | undefined,
): { r: number; g: number; b: number } | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  if (HEX_LONG.test(normalized)) {
    return {
      r: Number.parseInt(normalized.slice(1, 3), 16),
      g: Number.parseInt(normalized.slice(3, 5), 16),
      b: Number.parseInt(normalized.slice(5, 7), 16),
    };
  }
  if (HEX_SHORT.test(normalized)) {
    return {
      r: Number.parseInt(normalized[1]!.repeat(2), 16),
      g: Number.parseInt(normalized[2]!.repeat(2), 16),
      b: Number.parseInt(normalized[3]!.repeat(2), 16),
    };
  }
  return null;
}

export function rgbToHsl(r: number, g: number, b: number): Hsl {
  const red = r / 255;
  const green = g / 255;
  const blue = b / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const delta = max - min;
  const l = (max + min) / 2;

  if (delta === 0) return { h: 0, s: 0, l };

  const s = l <= 0.5 ? delta / (max + min) : delta / (2 - max - min);

  let h: number;
  if (max === red) {
    h = 60 * (((green - blue) / delta + 6) % 6);
  } else if (max === green) {
    h = 60 * ((blue - red) / delta + 2);
  } else {
    h = 60 * ((red - green) / delta + 4);
  }

  return { h, s, l };
}

function hueToChannel(p: number, q: number, t: number): number {
  let position = t;
  if (position < 0) position += 1;
  if (position > 1) position -= 1;
  if (position < 1 / 6) return p + (q - p) * 6 * position;
  if (position < 1 / 2) return q;
  if (position < 2 / 3) return p + (q - p) * (2 / 3 - position) * 6;
  return p;
}

export function hslToHex({ h, s, l }: Hsl): string {
  const hue = (((h % 360) + 360) % 360) / 360;
  const q = l <= 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const channel = (t: number) =>
    Math.min(255, Math.max(0, Math.round(hueToChannel(p, q, t) * 255)));
  const toHex = (value: number) => value.toString(16).padStart(2, "0");
  return `#${toHex(channel(hue + 1 / 3))}${toHex(channel(hue))}${toHex(
    channel(hue - 1 / 3),
  )}`;
}

/**
 * Hue-preserving dark tint. A near-grey source yields the neutral tile rather
 * than a hue reconstructed from rounding noise, which would tint C red.
 */
export function deriveTileColor(color: string | null | undefined): string {
  const rgb = parseHex(color);
  if (rgb === null) return FALLBACK_TILE_COLOR;

  const { h, s, l } = rgbToHsl(rgb.r, rgb.g, rgb.b);
  if (s < TILE_ACHROMATIC_THRESHOLD) return FALLBACK_TILE_COLOR;
  if (chroma(rgb.r, rgb.g, rgb.b) < TILE_ACHROMATIC_CHROMA) {
    return FALLBACK_TILE_COLOR;
  }

  return hslToHex({
    h,
    s: TILE_SATURATION_BASE + TILE_SATURATION_FACTOR * s,
    l: TILE_LIGHTNESS_BASE + TILE_LIGHTNESS_FACTOR * l,
  });
}
