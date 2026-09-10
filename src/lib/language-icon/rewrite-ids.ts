import { ICON_ID_SENTINEL } from "@/lib/language-icon/config";

const ID_DECLARATION = /\bid="([^"]*)"/g;
const LOCAL_HREF = /\b(xlink:href|href)="#([^"]*)"/g;
const LOCAL_URL = /url\(#([^)"']*)\)/g;

let sequence = 0;

export function collectDeclaredIds(markup: string): Set<string> {
  const ids = new Set<string>();
  ID_DECLARATION.lastIndex = 0;
  let match = ID_DECLARATION.exec(markup);
  while (match !== null) {
    const id = match[1] ?? "";
    if (id.length > 0 && !id.startsWith(ICON_ID_SENTINEL)) ids.add(id);
    match = ID_DECLARATION.exec(markup);
  }
  return ids;
}

/**
 * Cache-time stage: declared ids and every local reference to them become the
 * sentinel form, so one cached string serves any per-request prefix.
 */
export function rewriteDeclaredIds(markup: string): string {
  const declared = collectDeclaredIds(markup);
  if (declared.size === 0) return markup;

  return markup
    .replace(ID_DECLARATION, (whole, id: string) =>
      declared.has(id) ? `id="${ICON_ID_SENTINEL}${id}"` : whole,
    )
    .replace(LOCAL_HREF, (whole, attribute: string, id: string) =>
      declared.has(id) ? `${attribute}="#${ICON_ID_SENTINEL}${id}"` : whole,
    )
    .replace(LOCAL_URL, (whole, id: string) =>
      declared.has(id) ? `url(#${ICON_ID_SENTINEL}${id})` : whole,
    );
}

/** Emit-time stage: swap the sentinel for this request's prefix. */
export function applyIdPrefix(markup: string, prefix: string): string {
  return markup.split(ICON_ID_SENTINEL).join(prefix);
}

export function createIdPrefix(slug: string): string {
  sequence += 1;
  const token = `${sequence.toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  return `bgi-${slug}-${token}-`;
}
