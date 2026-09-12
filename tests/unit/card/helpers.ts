import { readFileSync } from "node:fs";
import { expect } from "bun:test";
import type { Repository } from "@/lib/github/types";
import { createIconCache } from "@/lib/language-icon/icon-cache";
import { resolveLanguageIcon } from "@/lib/language-icon/resolve-language-icon";
import type {
  FetchImplementation,
  LanguageVisual,
} from "@/lib/language-icon/types";

export const NOW = Date.parse("2026-09-08T00:00:00Z");

export const REPOSITORY: Repository = {
  owner: "vercel",
  name: "next.js",
  fullName: "vercel/next.js",
  language: "JavaScript",
  pushedAt: "2026-08-28T14:03:11Z",
  htmlUrl: "https://github.com/vercel/next.js",
};

export const LONG_NAME = "some-extremely-long-repository-name-here";

function fixtureFor(url: string): string {
  const match = /icons\/[^/]+\/([^/]+\.svg)$/.exec(url);
  return readFileSync(`tests/fixtures/devicon/${match![1]}`, "utf8");
}

const fetchImpl: FetchImplementation = async (url) =>
  new Response(fixtureFor(url));

export async function visualFor(
  language: string | null,
  idPrefix = "bgi-test",
): Promise<LanguageVisual> {
  return resolveLanguageIcon(language, {
    idPrefix,
    deps: { fetchImpl, cache: createIconCache() },
  });
}

// Bun's test runtime has no DOMParser, so well-formedness is checked by walking
// the tags and requiring every open element to be closed in order.
export function isBalancedXml(markup: string): boolean {
  const stack: string[] = [];
  for (const match of markup.matchAll(
    /<(\/?)([A-Za-z][\w:.-]*)[^>]*?(\/?)>/g,
  )) {
    const [, closing, name, selfClosing] = match;
    if (closing === "/") {
      if (stack.pop() !== name) return false;
    } else if (selfClosing !== "/") {
      stack.push(name!);
    }
  }
  return stack.length === 0;
}

export function expectStandaloneSvg(markup: string, width: number): void {
  expect(markup.startsWith("<svg")).toBe(true);
  expect(markup.endsWith("</svg>")).toBe(true);
  expect(markup).toBe(markup.trim());
  expect(isBalancedXml(markup)).toBe(true);
  expect(markup).toContain('xmlns="http://www.w3.org/2000/svg"');
  expect(markup).toContain(`width="${width}"`);
  expect(markup).toContain('height="150"');
  expect(markup).toContain(`viewBox="0 0 ${width} 150"`);
  expect(markup).toContain('role="img"');
}

export function expectZeroExternalReferences(markup: string): void {
  for (const forbidden of [
    "<image",
    "<script",
    "<style",
    "<link",
    "<foreignObject",
    "data:",
    "@import",
    "javascript:",
  ]) {
    expect(markup).not.toContain(forbidden);
  }
  expect(markup).not.toMatch(/\son[a-z]+=/i);
  for (const match of markup.matchAll(/url\(([^)]*)\)/g)) {
    expect(match[1]!.startsWith("#") || match[1]!.startsWith("'#")).toBe(true);
  }
  for (const match of markup.matchAll(/<use[^>]*>/g)) {
    expect(match[0]).toMatch(/(?:xlink:)?href="#/);
  }
  for (const match of markup.matchAll(/(?<![:\w])href="([^"]*)"/g)) {
    expect(match[1]!.startsWith("https://github.com/")).toBe(true);
  }
  for (const match of markup.matchAll(/xlink:href="([^"]*)"/g)) {
    expect(match[1]!.startsWith("#")).toBe(true);
  }
}

export function rendererHrefs(markup: string): string[] {
  return Array.from(
    markup.matchAll(/(?<![:\w])href="([^"]*)"/g),
    (match) => match[1]!,
  );
}

export function rootElement(markup: string): string {
  return /^<svg[^>]*>/.exec(markup)![0];
}

export function backgroundRect(markup: string): string {
  return /<rect[^>]*>/.exec(markup)![0];
}

export function textContent(markup: string, x: number, y: number): string {
  const pattern = new RegExp(`<text x="${x}" y="${y}"[^>]*>([^<]*)</text>`);
  const match = pattern.exec(markup);
  return match ? match[1]! : "";
}
