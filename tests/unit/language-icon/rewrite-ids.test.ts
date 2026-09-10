import { describe, expect, test } from "bun:test";
import {
  applyIdPrefix,
  collectDeclaredIds,
  createIdPrefix,
  rewriteDeclaredIds,
} from "@/lib/language-icon/rewrite-ids";

function prefixed(markup: string, prefix: string): string {
  return applyIdPrefix(rewriteDeclaredIds(markup), prefix);
}

const FRAGMENT =
  '<svg viewBox="0 0 1 1">' +
  '<defs><linearGradient id="a"><stop offset="0"/></linearGradient>' +
  '<clipPath id="b"><rect width="1" height="1"/></clipPath>' +
  '<mask id="c"><rect width="1" height="1"/></mask>' +
  '<path id="d" d="M0 0"/></defs>' +
  '<use xlink:href="#d"/><use href="#d"/>' +
  '<path fill="url(#a)" clip-path="url(#b)" mask="url(#c)" d="M0 0"/>' +
  "</svg>";

describe("rewrite-ids", () => {
  test("declared id is prefixed", () => {
    expect(prefixed(FRAGMENT, "p-")).toContain('id="p-a"');
    expect(prefixed(FRAGMENT, "p-")).toContain('id="p-d"');
  });

  test("url reference is rewritten", () => {
    expect(prefixed(FRAGMENT, "p-")).toContain('fill="url(#p-a)"');
  });

  test("href and xlink:href references are rewritten", () => {
    const markup = prefixed(FRAGMENT, "p-");
    expect(markup).toContain('xlink:href="#p-d"');
    expect(markup).toContain('href="#p-d"');
  });

  test("clip-path and mask references are rewritten", () => {
    const markup = prefixed(FRAGMENT, "p-");
    expect(markup).toContain('clip-path="url(#p-b)"');
    expect(markup).toContain('mask="url(#p-c)"');
  });

  test("undeclared reference is left untouched", () => {
    const markup = prefixed(
      '<svg viewBox="0 0 1 1"><path id="a" fill="url(#missing)" d="M0 0"/></svg>',
      "p-",
    );
    expect(markup).toContain('fill="url(#missing)"');
    expect(markup).toContain('id="p-a"');
  });

  test("two prefixes produce disjoint id sets", () => {
    const first = collectDeclaredIds(prefixed(FRAGMENT, "one-"));
    const second = collectDeclaredIds(prefixed(FRAGMENT, "two-"));
    expect(first.size).toBeGreaterThan(0);
    for (const id of first) {
      expect(second.has(id)).toBe(false);
    }
  });

  test("prefix is applied once", () => {
    const once = rewriteDeclaredIds(FRAGMENT);
    expect(rewriteDeclaredIds(once)).toBe(once);
    const emitted = applyIdPrefix(once, "p-");
    expect(applyIdPrefix(emitted, "p-")).toBe(emitted);
    expect(emitted).not.toContain("p-p-");
  });

  test("id-like text that is not a reference is not rewritten", () => {
    const markup = prefixed(
      '<svg viewBox="0 0 1 1"><path id="a" d="M0 0" data-note="#a"/></svg>',
      "p-",
    );
    expect(markup).toContain('data-note="#a"');
  });

  test("a fragment without declared ids is returned unchanged", () => {
    const plain = '<svg viewBox="0 0 1 1"><path d="M0 0"/></svg>';
    expect(rewriteDeclaredIds(plain)).toBe(plain);
  });

  test("generated prefixes are unique and well shaped", () => {
    const prefixes = new Set(
      Array.from({ length: 50 }, () => createIdPrefix("go")),
    );
    expect(prefixes.size).toBe(50);
    for (const prefix of prefixes) {
      expect(prefix).toMatch(/^bgi-go-[0-9a-z]+-$/);
    }
  });
});
