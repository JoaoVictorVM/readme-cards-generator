import {
  FALLBACK_GLYPH_COLOR,
  LANGUAGE_ICON_PRESERVE_ASPECT_RATIO,
  LANGUAGE_ICON_SIZE_PX,
} from "@/lib/language-icon/config";

const STROKE = `fill="none" stroke="${FALLBACK_GLYPH_COLOR}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"`;

const GLYPH_MARKUP =
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"` +
  ` width="${LANGUAGE_ICON_SIZE_PX}" height="${LANGUAGE_ICON_SIZE_PX}"` +
  ` preserveAspectRatio="${LANGUAGE_ICON_PRESERVE_ASPECT_RATIO}">` +
  `<polyline points="12,10 5,16 12,22" ${STROKE}/>` +
  `<polyline points="19,8 13,24" ${STROKE}/>` +
  `<polyline points="20,10 27,16 20,22" ${STROKE}/>` +
  `</svg>`;

export function fallbackGlyphMarkup(): string {
  return GLYPH_MARKUP;
}
