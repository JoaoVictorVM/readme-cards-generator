import { logError, logWarn } from "@/lib/logger";
import {
  CARD_DEFAULT_WIDTH,
  CARD_HEIGHT,
  ERROR_FONT_SIZE,
  ERROR_FONT_WEIGHT,
} from "@/lib/card/config";
import { cardCopyFor } from "@/lib/card/copy";
import { escapeXml } from "@/lib/card/escape-xml";
import { closeFrame, openFrame } from "@/lib/card/frame";
import { computeLayout } from "@/lib/card/layout";
import {
  resolveCardLocale,
  resolveCardTheme,
  resolveCardWidth,
} from "@/lib/card/options";
import { CARD_PALETTES, paletteFor } from "@/lib/card/themes";
import { truncateText } from "@/lib/card/truncate-text";
import {
  ERROR_CARD_KINDS,
  type CardPalette,
  type ErrorCardKind,
  type RenderErrorCardInput,
} from "@/lib/card/types";

// Emitted only when even the error card cannot be assembled; it carries the
// dark frame at the default width so an embed never receives an empty body.
export const LAST_RESORT_SVG =
  `<svg xmlns="http://www.w3.org/2000/svg" width="${CARD_DEFAULT_WIDTH}"` +
  ` height="${CARD_HEIGHT}" viewBox="0 0 ${CARD_DEFAULT_WIDTH} ${CARD_HEIGHT}"` +
  ` role="img"><rect x="0.5" y="0.5" width="${CARD_DEFAULT_WIDTH - 1}"` +
  ` height="${CARD_HEIGHT - 1}" rx="12" fill="${CARD_PALETTES.dark.surface}"` +
  ` stroke="${CARD_PALETTES.dark.border}"` +
  ` stroke-width="1"/></svg>`;

function isErrorCardKind(value: unknown): value is ErrorCardKind {
  return typeof value === "string" && value in ERROR_CARD_KINDS;
}

function errorName(error: unknown): string {
  if (error instanceof Error) return error.name;
  return typeof error;
}

function warningGlyph(x: number, y: number, palette: CardPalette): string {
  const color = escapeXml(palette.dotAmber);
  return (
    `<g transform="translate(${x} ${y})">` +
    `<path d="M12 2.5 L22.5 20.5 H1.5 Z" fill="none" stroke="${color}"` +
    ` stroke-width="2" stroke-linejoin="round"/>` +
    `<path d="M12 9 V14.5" fill="none" stroke="${color}" stroke-width="2"` +
    ` stroke-linecap="round"/>` +
    `<circle cx="12" cy="17.5" r="1.25" fill="${color}"/>` +
    `</g>`
  );
}

function assembleErrorCard(input: RenderErrorCardInput): string {
  const theme = resolveCardTheme(input.theme);
  const locale = resolveCardLocale(input.locale);
  const width = resolveCardWidth(input.width);

  let kind: ErrorCardKind;
  if (isErrorCardKind(input.kind)) {
    kind = input.kind;
  } else {
    logWarn("error card received an unknown kind", {
      received: typeof input.kind,
    });
    kind = "unexpected_error";
  }

  const copy = cardCopyFor(locale);
  const palette = paletteFor(theme);
  const layout = computeLayout(width);
  const message = copy.errors[kind];
  const hint = kind === "rate_limited" ? copy.hints.rate_limited : undefined;
  const line = truncateText(message, layout.errorMessage.budgetChars);

  return (
    openFrame({ layout, palette, title: message, description: hint }) +
    warningGlyph(layout.errorGlyph.x, layout.errorGlyph.y, palette) +
    `<text x="${layout.errorMessage.x}" y="${layout.errorMessage.y}"` +
    ` font-size="${ERROR_FONT_SIZE}" font-weight="${ERROR_FONT_WEIGHT}"` +
    ` fill="${escapeXml(palette.primary)}">${escapeXml(line)}</text>` +
    closeFrame()
  );
}

export function renderErrorCard(input: RenderErrorCardInput): string {
  try {
    return assembleErrorCard(input);
  } catch (error) {
    logError("error card render failed", { error: errorName(error) });
  }
  try {
    return assembleErrorCard({
      kind: "unexpected_error",
      theme: input?.theme,
      locale: input?.locale,
      width: input?.width,
    });
  } catch (error) {
    logError("error card fallback render failed", { error: errorName(error) });
    return LAST_RESORT_SVG;
  }
}
