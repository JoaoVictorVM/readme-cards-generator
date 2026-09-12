import { CARD_BORDER_WIDTH, FONT_STACK } from "@/lib/card/config";
import { escapeXml } from "@/lib/card/escape-xml";
import type { CardLayout, CardPalette } from "@/lib/card/types";

export type FrameOptions = {
  layout: CardLayout;
  palette: CardPalette;
  title: string;
  description?: string;
};

export function openFrame(options: FrameOptions): string {
  const { layout, palette } = options;
  const { background } = layout;
  const desc =
    options.description === undefined
      ? ""
      : `<desc>${escapeXml(options.description)}</desc>`;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${layout.width}"` +
    ` height="${layout.height}" viewBox="0 0 ${layout.width} ${layout.height}"` +
    ` role="img" font-family="${escapeXml(FONT_STACK)}">` +
    `<title>${escapeXml(options.title)}</title>` +
    desc +
    `<rect x="${background.x}" y="${background.y}" width="${background.width}"` +
    ` height="${background.height}" rx="${background.rx}"` +
    ` fill="${escapeXml(palette.surface)}" stroke="${escapeXml(palette.border)}"` +
    ` stroke-width="${CARD_BORDER_WIDTH}"/>`
  );
}

export function closeFrame(): string {
  return "</svg>";
}
