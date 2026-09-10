import { FALLBACK_TILE_COLOR } from "@/lib/language-icon/config";
import { fallbackGlyphMarkup } from "@/lib/language-icon/fallback-glyph";
import { iconCache } from "@/lib/language-icon/icon-cache";
import { lookupLanguage } from "@/lib/language-icon/language-map";
import { applyIdPrefix, createIdPrefix } from "@/lib/language-icon/rewrite-ids";
import { deriveTileColor } from "@/lib/language-icon/tile-color";
import { logErrorOnce } from "@/lib/logger";
import type {
  LanguageVisual,
  ResolveLanguageIconOptions,
} from "@/lib/language-icon/types";

function fallback(
  language: string | null,
  slug: string | null,
): LanguageVisual {
  return {
    iconMarkup: fallbackGlyphMarkup(),
    tileColor: FALLBACK_TILE_COLOR,
    source: "fallback",
    language,
    slug,
  };
}

export async function resolveLanguageIcon(
  language: string | null,
  options: ResolveLanguageIconOptions = {},
): Promise<LanguageVisual> {
  const entry = (() => {
    try {
      return lookupLanguage(language);
    } catch {
      return null;
    }
  })();
  if (entry === null) return fallback(null, null);

  try {
    const dependencies = options.deps ?? {};
    const cache = dependencies.cache ?? iconCache;
    const loaded = await cache.load(entry.slug, entry.variant, dependencies);

    if (!loaded.ok) {
      logErrorOnce(
        `devicon-failure:${entry.slug}:${loaded.cause}`,
        "devicon icon could not be resolved",
        { slug: entry.slug, cause: loaded.cause },
      );
      return fallback(entry.language, entry.slug);
    }

    const makePrefix = dependencies.createIdPrefix ?? createIdPrefix;
    const prefix = options.idPrefix ?? makePrefix(entry.slug);

    return {
      iconMarkup: applyIdPrefix(loaded.markup, prefix),
      tileColor: deriveTileColor(entry.color),
      source: "devicon",
      language: entry.language,
      slug: entry.slug,
    };
  } catch (error) {
    logErrorOnce(
      `devicon-unexpected:${entry.slug}`,
      "devicon icon resolution threw",
      {
        slug: entry.slug,
        error: error instanceof Error ? error.message : typeof error,
      },
    );
    return fallback(entry.language, entry.slug);
  }
}
