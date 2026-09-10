import { siteConfig } from "@/lib/site-config";

export const DEVICON_RELEASE = "v2.17.0";

export const DEVICON_CDN_ORIGIN = "https://cdn.jsdelivr.net";

export const DEVICON_DEFAULT_VARIANT = "original";

export const DEVICON_ACCEPT_HEADER = "image/svg+xml";

export const DEVICON_USER_AGENT = `badge-generate/1.0 (+${siteConfig.repositoryUrl})`;

export const DEVICON_REQUEST_TIMEOUT_MS = 2000;

export const DEVICON_MAX_RESPONSE_BYTES = 256 * 1024;

export const DEVICON_SUCCESS_STATUS = 200;

export const ICON_FAILURE_TTL_MS = 60_000;

export const TILE_SATURATION_BASE = 0.35;

export const TILE_SATURATION_FACTOR = 0.1;

export const TILE_LIGHTNESS_BASE = 0.12;

export const TILE_LIGHTNESS_FACTOR = 0.06;

export const TILE_ACHROMATIC_THRESHOLD = 0.05;

/**
 * Near-black sources such as Crystal's `#000100` carry full HSL saturation off
 * a single unit of chroma, so the saturation guard alone would tint them from
 * rounding noise. The chroma floor catches them.
 */
export const TILE_ACHROMATIC_CHROMA = 0.05;

export const FALLBACK_TILE_COLOR = "#2b2f3a";

export const FALLBACK_GLYPH_COLOR = "#c9d1d9";

export const LANGUAGE_ICON_SIZE_PX = 32;

export const LANGUAGE_ICON_PRESERVE_ASPECT_RATIO = "xMidYMid meet";

/**
 * Placeholder every declared id is rewritten to before caching, so one cached
 * string can serve any per-request prefix through a single substitution.
 */
export const ICON_ID_SENTINEL = "__bgi_id__";

export function buildDeviconUrl(slug: string, variant: string): string {
  return `${DEVICON_CDN_ORIGIN}/gh/devicons/devicon@${DEVICON_RELEASE}/icons/${slug}/${slug}-${variant}.svg`;
}
