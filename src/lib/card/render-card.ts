import { format } from "@/i18n/get-dictionary";
import { fallbackGlyphMarkup } from "@/lib/language-icon";
import { logError, logWarn } from "@/lib/logger";
import { computeActivity } from "@/lib/card/activity";
import {
  ACTIVITY_FONT_SIZE,
  ACTIVITY_FONT_WEIGHT,
  BUTTON_FONT_SIZE,
  BUTTON_FONT_WEIGHT,
  NAME_FONT_SIZE,
  NAME_FONT_WEIGHT,
  REPOSITORY_LINK_ORIGIN,
} from "@/lib/card/config";
import { cardCopyFor, type CardCopy } from "@/lib/card/copy";
import { escapeXml } from "@/lib/card/escape-xml";
import { closeFrame, openFrame } from "@/lib/card/frame";
import { computeLayout } from "@/lib/card/layout";
import {
  resolveCardLocale,
  resolveCardTheme,
  resolveCardWidth,
} from "@/lib/card/options";
import { LAST_RESORT_SVG, renderErrorCard } from "@/lib/card/render-error-card";
import { paletteFor } from "@/lib/card/themes";
import { truncateText } from "@/lib/card/truncate-text";
import type { Activity, CardPalette, RenderCardInput } from "@/lib/card/types";
import type { LanguageVisual } from "@/lib/language-icon/types";

function errorName(error: unknown): string {
  if (error instanceof Error) return error.name;
  return typeof error;
}

function guardedIconMarkup(visual: LanguageVisual): string {
  const markup = visual.iconMarkup;
  if (
    typeof markup === "string" &&
    markup.startsWith("<svg") &&
    markup.endsWith("</svg>")
  ) {
    return markup;
  }
  logWarn("language icon markup violated the fragment contract", {
    slug: visual.slug,
    source: visual.source,
  });
  return fallbackGlyphMarkup();
}

function activityLine(activity: Activity, copy: CardCopy): string {
  if (!activity.known) return copy.activityUnknown;
  const forms = copy.units[activity.unit];
  const unit = activity.count === 1 ? forms.one : forms.many;
  return format(copy.activityTemplate, { n: activity.count, unit });
}

function dotColor(activity: Activity, palette: CardPalette): string {
  if (activity.band === "green") return palette.dotGreen;
  if (activity.band === "amber") return palette.dotAmber;
  return palette.dotGray;
}

function assembleCard(input: RenderCardInput): string {
  const theme = resolveCardTheme(input.theme);
  const locale = resolveCardLocale(input.locale);
  const width = resolveCardWidth(input.width);
  const now = input.now ?? Date.now();

  const { repository, visual } = input;
  const copy = cardCopyFor(locale);
  const palette = paletteFor(theme);
  const layout = computeLayout(width);
  const activity = computeActivity(repository.pushedAt, now);

  const name = truncateText(repository.name, layout.name.budgetChars);
  const line = truncateText(
    activityLine(activity, copy),
    layout.activity.budgetChars,
  );
  const { tile, icon, dot, button } = layout;

  const buttonMarkup =
    `<rect x="${button.x}" y="${button.y}" width="${button.width}"` +
    ` height="${button.height}" rx="${button.rx}"` +
    ` fill="${escapeXml(palette.buttonBackground)}"/>` +
    `<text x="${button.labelX}" y="${button.labelY}" text-anchor="middle"` +
    ` font-size="${BUTTON_FONT_SIZE}" font-weight="${BUTTON_FONT_WEIGHT}"` +
    ` fill="${escapeXml(palette.buttonLabel)}">${escapeXml(copy.buttonLabel)}</text>`;
  const linked =
    typeof repository.htmlUrl === "string" &&
    repository.htmlUrl.startsWith(REPOSITORY_LINK_ORIGIN)
      ? `<a href="${escapeXml(repository.htmlUrl)}">${buttonMarkup}</a>`
      : buttonMarkup;

  return (
    openFrame({ layout, palette, title: repository.fullName }) +
    `<rect x="${tile.x}" y="${tile.y}" width="${tile.size}" height="${tile.size}"` +
    ` rx="${tile.rx}" fill="${escapeXml(visual.tileColor)}"/>` +
    `<g transform="translate(${icon.x} ${icon.y})">${guardedIconMarkup(visual)}</g>` +
    `<text x="${layout.name.x}" y="${layout.name.y}" font-size="${NAME_FONT_SIZE}"` +
    ` font-weight="${NAME_FONT_WEIGHT}" fill="${escapeXml(palette.primary)}">` +
    `${escapeXml(name)}</text>` +
    `<circle cx="${dot.cx}" cy="${dot.cy}" r="${dot.r}"` +
    ` fill="${escapeXml(dotColor(activity, palette))}"/>` +
    `<text x="${layout.activity.x}" y="${layout.activity.y}"` +
    ` font-size="${ACTIVITY_FONT_SIZE}" font-weight="${ACTIVITY_FONT_WEIGHT}"` +
    ` fill="${escapeXml(palette.secondary)}">${escapeXml(line)}</text>` +
    linked +
    closeFrame()
  );
}

export function renderCard(input: RenderCardInput): string {
  try {
    return assembleCard(input);
  } catch (error) {
    logError("card render failed", { error: errorName(error) });
  }
  try {
    return renderErrorCard({
      kind: "unexpected_error",
      theme: input?.theme,
      locale: input?.locale,
      width: input?.width,
    });
  } catch (error) {
    logError("card fallback render failed", { error: errorName(error) });
    return LAST_RESORT_SVG;
  }
}
