import {
  LANGUAGE_ICON_PRESERVE_ASPECT_RATIO,
  LANGUAGE_ICON_SIZE_PX,
} from "@/lib/language-icon/config";
import type { SanitizeResult } from "@/lib/language-icon/types";

const ELEMENT_ALLOWLIST = new Set([
  "svg",
  "g",
  "defs",
  "symbol",
  "use",
  "path",
  "circle",
  "ellipse",
  "rect",
  "line",
  "polyline",
  "polygon",
  "clipPath",
  "mask",
  "linearGradient",
  "radialGradient",
  "stop",
]);

const ATTRIBUTE_ALLOWLIST = new Set([
  "id",
  "class",
  "d",
  "points",
  "x",
  "y",
  "x1",
  "y1",
  "x2",
  "y2",
  "cx",
  "cy",
  "r",
  "rx",
  "ry",
  "fx",
  "fy",
  "width",
  "height",
  "viewBox",
  "preserveAspectRatio",
  "transform",
  "gradientTransform",
  "gradientUnits",
  "spreadMethod",
  "clipPathUnits",
  "maskUnits",
  "maskContentUnits",
  "offset",
  "opacity",
  "fill",
  "fill-opacity",
  "fill-rule",
  "clip-rule",
  "clip-path",
  "mask",
  "stroke",
  "stroke-width",
  "stroke-opacity",
  "stroke-linecap",
  "stroke-linejoin",
  "stroke-miterlimit",
  "stroke-dasharray",
  "stroke-dashoffset",
  "stop-color",
  "stop-opacity",
  "style",
  "href",
  "xlink:href",
]);

const ROOT_ONLY_DROPPED = new Set([
  "x",
  "y",
  "width",
  "height",
  "viewBox",
  "preserveAspectRatio",
]);

const ATTRIBUTE_PATTERN =
  /([A-Za-z_:][-A-Za-z0-9_:.]*)\s*=\s*"([^"]*)"|([A-Za-z_:][-A-Za-z0-9_:.]*)\s*=\s*'([^']*)'/g;
const URL_FUNCTION = /url\(\s*(['"]?)([^)]*)\1\s*\)/gi;
const BARE_AMPERSAND = /&(?!#\d+;|#x[0-9a-fA-F]+;|[A-Za-z][A-Za-z0-9]*;)/g;

type Attribute = { name: string; value: string };

function parseAttributes(source: string): Attribute[] {
  const attributes: Attribute[] = [];
  ATTRIBUTE_PATTERN.lastIndex = 0;
  let match = ATTRIBUTE_PATTERN.exec(source);
  while (match !== null) {
    attributes.push({
      name: match[1] ?? match[3] ?? "",
      value: match[2] ?? match[4] ?? "",
    });
    match = ATTRIBUTE_PATTERN.exec(source);
  }
  return attributes;
}

function escapeValue(value: string): string {
  return value
    .replace(BARE_AMPERSAND, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/"/g, "&quot;");
}

function everyUrlIsLocal(value: string): boolean {
  URL_FUNCTION.lastIndex = 0;
  let match = URL_FUNCTION.exec(value);
  while (match !== null) {
    if (!(match[2] ?? "").trim().startsWith("#")) return false;
    match = URL_FUNCTION.exec(value);
  }
  return true;
}

function styleIsSafe(value: string): boolean {
  const lowered = value.toLowerCase();
  if (
    lowered.includes("expression(") ||
    lowered.includes("@import") ||
    lowered.includes("javascript:") ||
    lowered.includes("data:")
  ) {
    return false;
  }
  return everyUrlIsLocal(value);
}

function isNamespaceDeclaration(name: string): boolean {
  return name === "xmlns" || name.startsWith("xmlns:");
}

function attributeIsAllowed(attribute: Attribute): boolean {
  const { name, value } = attribute;
  if (/^on/i.test(name)) return false;
  if (!ATTRIBUTE_ALLOWLIST.has(name)) return false;

  const lowered = value.trim().toLowerCase();
  if (lowered.startsWith("javascript:") || lowered.startsWith("data:")) {
    return false;
  }
  if (name === "href" || name === "xlink:href") {
    return value.trim().startsWith("#");
  }
  if (name === "style") return styleIsSafe(value);
  return everyUrlIsLocal(value);
}

function serializeAttributes(
  attributes: Attribute[],
  removed: string[],
  skip: ReadonlySet<string>,
): { markup: string; referenceRejected: boolean } {
  let markup = "";
  let referenceRejected = false;
  for (const attribute of attributes) {
    if (skip.has(attribute.name) || isNamespaceDeclaration(attribute.name)) {
      continue;
    }
    if (!attributeIsAllowed(attribute)) {
      removed.push(`@${attribute.name}`);
      if (attribute.name === "href" || attribute.name === "xlink:href") {
        referenceRejected = true;
      }
      continue;
    }
    markup += ` ${attribute.name}="${escapeValue(attribute.value)}"`;
  }
  return { markup, referenceRejected };
}

function buildRoot(attributes: Attribute[], removed: string[]): string {
  let markup = "<svg";
  let hasDefaultNamespace = false;

  for (const attribute of attributes) {
    if (!isNamespaceDeclaration(attribute.name)) continue;
    if (attribute.name === "xmlns") hasDefaultNamespace = true;
    markup += ` ${attribute.name}="${escapeValue(attribute.value)}"`;
  }
  if (!hasDefaultNamespace) {
    markup = `<svg xmlns="http://www.w3.org/2000/svg"${markup.slice(4)}`;
  }

  const viewBox = attributes.find((attribute) => attribute.name === "viewBox");
  const width = attributes.find((attribute) => attribute.name === "width");
  const height = attributes.find((attribute) => attribute.name === "height");
  const declared =
    viewBox?.value.trim() ??
    (width && height
      ? `0 0 ${Number.parseFloat(width.value)} ${Number.parseFloat(height.value)}`
      : `0 0 ${LANGUAGE_ICON_SIZE_PX} ${LANGUAGE_ICON_SIZE_PX}`);

  markup += ` viewBox="${escapeValue(declared)}"`;
  markup += ` width="${LANGUAGE_ICON_SIZE_PX}" height="${LANGUAGE_ICON_SIZE_PX}"`;
  markup += ` preserveAspectRatio="${LANGUAGE_ICON_PRESERVE_ASPECT_RATIO}"`;
  markup += serializeAttributes(attributes, removed, ROOT_ONLY_DROPPED).markup;

  return `${markup}>`;
}

/**
 * Allowlist scan over untrusted markup. Everything not named here is dropped,
 * so an injection vector nobody anticipated is denied by default.
 */
export function sanitizeSvg(source: string): SanitizeResult {
  const removed: string[] = [];
  const stack: string[] = [];
  let output = "";
  let index = 0;
  let dropDepth = 0;
  let rootSeen = false;
  let rootClosed = false;

  while (index < source.length) {
    const open = source.indexOf("<", index);
    if (open === -1) break;

    if (source.startsWith("<!--", open)) {
      const end = source.indexOf("-->", open);
      if (end === -1) return { ok: false, cause: "malformed" };
      index = end + 3;
      continue;
    }
    if (source.startsWith("<?", open)) {
      const end = source.indexOf("?>", open);
      if (end === -1) return { ok: false, cause: "malformed" };
      index = end + 2;
      continue;
    }
    if (source.startsWith("<!", open)) {
      const end = source.indexOf(">", open);
      if (end === -1) return { ok: false, cause: "malformed" };
      index = end + 1;
      continue;
    }

    const close = source.indexOf(">", open);
    if (close === -1) return { ok: false, cause: "malformed" };
    const inner = source.slice(open + 1, close);
    index = close + 1;

    if (inner.startsWith("/")) {
      const name = inner.slice(1).trim();
      if (dropDepth > 0) {
        dropDepth -= 1;
        continue;
      }
      if (stack.pop() !== name) return { ok: false, cause: "malformed" };
      output += `</${name}>`;
      if (stack.length === 0) rootClosed = true;
      continue;
    }

    const selfClosing = inner.endsWith("/");
    const body = selfClosing ? inner.slice(0, -1) : inner;
    const nameMatch = /^[A-Za-z_:][-A-Za-z0-9_:.]*/.exec(body.trim());
    if (nameMatch === null) return { ok: false, cause: "malformed" };
    const name = nameMatch[0];

    if (dropDepth > 0) {
      if (!selfClosing) dropDepth += 1;
      continue;
    }

    const attributes = parseAttributes(
      body.slice(body.indexOf(name) + name.length),
    );

    if (!rootSeen) {
      if (name !== "svg") return { ok: false, cause: "malformed" };
      rootSeen = true;
      output += buildRoot(attributes, removed);
      if (selfClosing) {
        output += "</svg>";
        rootClosed = true;
      } else {
        stack.push(name);
      }
      continue;
    }

    if (rootClosed) return { ok: false, cause: "malformed" };

    if (!ELEMENT_ALLOWLIST.has(name)) {
      removed.push(name);
      if (!selfClosing) dropDepth = 1;
      continue;
    }

    const serialized = serializeAttributes(attributes, removed, new Set());
    if (serialized.referenceRejected) {
      removed.push(name);
      if (!selfClosing) dropDepth = 1;
      continue;
    }

    output += `<${name}${serialized.markup}${selfClosing ? "/>" : ">"}`;
    if (!selfClosing) stack.push(name);
  }

  if (!rootSeen || !rootClosed || stack.length > 0 || dropDepth > 0) {
    return { ok: false, cause: "malformed" };
  }

  return { ok: true, markup: output, removed };
}
