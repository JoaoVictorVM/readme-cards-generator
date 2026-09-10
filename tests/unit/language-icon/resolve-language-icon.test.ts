import { readFileSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, spyOn, test } from "bun:test";
import {
  DEVICON_REQUEST_TIMEOUT_MS,
  FALLBACK_TILE_COLOR,
  LANGUAGE_ICON_SIZE_PX,
} from "@/lib/language-icon/config";
import { createIconCache } from "@/lib/language-icon/icon-cache";
import { LANGUAGE_TABLE } from "@/lib/language-icon/language-map";
import { resolveLanguageIcon } from "@/lib/language-icon/resolve-language-icon";
import {
  deriveTileColor,
  parseHex,
  rgbToHsl,
} from "@/lib/language-icon/tile-color";
import type {
  FetchImplementation,
  IconCache,
  LanguageVisual,
} from "@/lib/language-icon/types";

const PRD_LANGUAGES = [
  "JavaScript",
  "TypeScript",
  "Python",
  "Java",
  "Go",
  "Rust",
  "C",
  "C++",
  "C#",
  "PHP",
  "Ruby",
  "Swift",
  "Kotlin",
  "Dart",
  "Shell",
  "HTML",
  "CSS",
  "Vue",
  "Elixir",
  "Scala",
  "Lua",
  "R",
  "Haskell",
  "Perl",
  "Objective-C",
  "Clojure",
  "Erlang",
  "Julia",
  "Zig",
  "Nim",
];

function fixtureFor(url: string): string {
  const match = /icons\/[^/]+\/([^/]+\.svg)$/.exec(url);
  return readFileSync(`tests/fixtures/devicon/${match![1]}`, "utf8");
}

function seam(handler?: (url: string) => Promise<Response> | Response) {
  const urls: string[] = [];
  const fetchImpl: FetchImplementation = async (url) => {
    urls.push(url);
    return handler ? handler(url) : new Response(fixtureFor(url));
  };
  return { urls, fetchImpl, cache: createIconCache() };
}

// Bun's test runtime has no DOMParser, so well-formedness is checked by walking
// the tags and requiring every open element to be closed in order.
function isBalancedXml(markup: string): boolean {
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

function idsIn(markup: string): Set<string> {
  return new Set(Array.from(markup.matchAll(/\bid="([^"]*)"/g), (m) => m[1]!));
}

function expectTotalShape(visual: LanguageVisual): void {
  expect(typeof visual.iconMarkup).toBe("string");
  expect(visual.iconMarkup.length).toBeGreaterThan(0);
  expect(visual.tileColor).toMatch(/^#[0-9a-f]{6}$/);
  expect(["devicon", "fallback"]).toContain(visual.source);
  expect(visual.language === null || typeof visual.language === "string").toBe(
    true,
  );
  expect(visual.slug === null || typeof visual.slug === "string").toBe(true);
}

let warnSpy: ReturnType<typeof spyOn>;
let errorSpy: ReturnType<typeof spyOn>;

beforeEach(() => {
  warnSpy = spyOn(console, "warn").mockImplementation(() => {});
  errorSpy = spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  warnSpy.mockRestore();
  errorSpy.mockRestore();
});

describe("resolveLanguageIcon", () => {
  test("thirty languages resolve to real devicon markup", async () => {
    for (const language of PRD_LANGUAGES) {
      const { fetchImpl, cache } = seam();
      const visual = await resolveLanguageIcon(language, {
        deps: { fetchImpl, cache },
      });
      expect(visual.source).toBe("devicon");
      expect(visual.iconMarkup).toMatch(
        /<(path|circle|rect|polygon|polyline|ellipse|line|use)\b/,
      );
      expectTotalShape(visual);
    }
  });

  test("go preserves the xlink namespace", async () => {
    const { fetchImpl, cache } = seam();
    const visual = await resolveLanguageIcon("Go", {
      deps: { fetchImpl, cache },
    });
    expect(visual.iconMarkup).toContain(
      'xmlns:xlink="http://www.w3.org/1999/xlink"',
    );
    expect(visual.iconMarkup).toContain('xlink:href="#');
    expect(isBalancedXml(visual.iconMarkup)).toBe(true);
  });

  test("a mapped language tile shares the hue and is not the neutral", async () => {
    const { fetchImpl, cache } = seam();
    const visual = await resolveLanguageIcon("Go", {
      deps: { fetchImpl, cache },
    });
    const source = ((rgb) => rgbToHsl(rgb.r, rgb.g, rgb.b))(
      parseHex("#00add8")!,
    );
    const tint = ((rgb) => rgbToHsl(rgb.r, rgb.g, rgb.b))(
      parseHex(visual.tileColor)!,
    );
    expect(visual.tileColor).not.toBe(FALLBACK_TILE_COLOR);
    expect(Math.abs(tint.h - source.h)).toBeLessThanOrEqual(2);
    expect(tint.s).toBeLessThan(source.s);
    expect(tint.l).toBeLessThan(source.l);
  });

  test("a null language returns the glyph and makes no request", async () => {
    const { urls, fetchImpl, cache } = seam();
    const visual = await resolveLanguageIcon(null, {
      deps: { fetchImpl, cache },
    });
    expect(visual).toEqual({
      iconMarkup: visual.iconMarkup,
      tileColor: FALLBACK_TILE_COLOR,
      source: "fallback",
      language: null,
      slug: null,
    });
    expect(visual.iconMarkup).toContain("<polyline");
    expect(urls).toHaveLength(0);
  });

  test("an unmapped language makes no request", async () => {
    const { urls, fetchImpl, cache } = seam();
    for (const language of ["Batchfile", "   ", ""]) {
      const visual = await resolveLanguageIcon(language, {
        deps: { fetchImpl, cache },
      });
      expect(visual.source).toBe("fallback");
      expect(visual.language).toBeNull();
      expect(visual.slug).toBeNull();
    }
    expect(urls).toHaveLength(0);
  });

  test("every fetch failure falls back without throwing", async () => {
    const failures: Array<() => Response | Promise<Response>> = [
      () => new Response("", { status: 404 }),
      () => new Response("", { status: 500 }),
      () => new Response("<!DOCTYPE html><html></html>"),
      () => new Response("x".repeat(300_000)),
      () => new Response("<svg><path></svg>"),
      () => {
        throw new TypeError("dns failure");
      },
    ];
    for (const handler of failures) {
      const { fetchImpl, cache } = seam(handler);
      const visual = await resolveLanguageIcon("Rust", {
        deps: { fetchImpl, cache },
      });
      expect(visual.source).toBe("fallback");
      expect(visual.tileColor).toBe(FALLBACK_TILE_COLOR);
      expect(visual.language).toBe("Rust");
      expect(visual.slug).toBe("rust");
      expectTotalShape(visual);
    }
  });

  test("a timeout falls back inside the budget", async () => {
    const cache = createIconCache();
    const fetchImpl: FetchImplementation = (_url, init) =>
      new Promise((_resolve, reject) => {
        init.signal?.addEventListener("abort", () =>
          reject(new DOMException("aborted", "AbortError")),
        );
      });
    const started = Date.now();
    const visual = await resolveLanguageIcon("Rust", {
      deps: { fetchImpl, cache },
    });
    const elapsed = Date.now() - started;
    expect(visual.source).toBe("fallback");
    expect(visual.tileColor).toBe(FALLBACK_TILE_COLOR);
    expect(elapsed).toBeLessThan(DEVICON_REQUEST_TIMEOUT_MS + 1000);
  });

  test("output contains no script, handler or external url", async () => {
    const cases = [...LANGUAGE_TABLE.map((entry) => entry.language), "Go"];
    for (const language of cases) {
      const { fetchImpl, cache } = seam();
      const visual = await resolveLanguageIcon(language, {
        deps: { fetchImpl, cache },
      });
      expect(visual.iconMarkup).not.toContain("<script");
      expect(visual.iconMarkup).not.toMatch(/\son[a-z]+\s*=/i);
      expect(visual.iconMarkup).not.toMatch(/(href|url\()\s*["']?\s*https?:/i);
      expect(visual.iconMarkup).not.toContain("javascript:");
      expect(visual.iconMarkup).not.toContain("data:");
      expect(visual.iconMarkup).not.toContain("<image");
    }

    const hostile = seam(
      () =>
        new Response(
          readFileSync("tests/fixtures/devicon/hostile.svg", "utf8"),
        ),
    );
    const visual = await resolveLanguageIcon("Go", {
      deps: { fetchImpl: hostile.fetchImpl, cache: hostile.cache },
    });
    expect(visual.source).toBe("devicon");
    expect(visual.iconMarkup).not.toContain("<script");
    expect(visual.iconMarkup).not.toContain("evil.example");
    expect(visual.iconMarkup).not.toMatch(/\son[a-z]+\s*=/i);
  });

  test("the emitted root is a single svg with the declared size", async () => {
    const { fetchImpl, cache } = seam();
    const visual = await resolveLanguageIcon("Go", {
      deps: { fetchImpl, cache },
    });
    expect(visual.iconMarkup.match(/<svg\b/g)).toHaveLength(1);
    expect(visual.iconMarkup.startsWith("<svg")).toBe(true);
    expect(visual.iconMarkup.endsWith("</svg>")).toBe(true);
    const root = visual.iconMarkup.slice(0, visual.iconMarkup.indexOf(">"));
    expect(root).toContain(`width="${LANGUAGE_ICON_SIZE_PX}"`);
    expect(root).toContain(`height="${LANGUAGE_ICON_SIZE_PX}"`);
    expect(root).toContain('viewBox="0 0 128 128"');
    expect(root).toContain('preserveAspectRatio="xMidYMid meet"');
    expect(root).not.toMatch(/\sx="/);
    expect(root).not.toMatch(/\sy="/);
  });

  test("two resolutions use distinct id prefixes", async () => {
    const { fetchImpl, cache } = seam();
    const deps = { fetchImpl, cache };
    const first = await resolveLanguageIcon("Go", { deps });
    const second = await resolveLanguageIcon("Go", { deps });
    const firstIds = idsIn(first.iconMarkup);
    const secondIds = idsIn(second.iconMarkup);
    expect(firstIds.size).toBeGreaterThan(0);
    for (const id of firstIds) {
      expect(secondIds.has(id)).toBe(false);
    }
  });

  test("a supplied id prefix is honoured", async () => {
    const { fetchImpl, cache } = seam();
    const visual = await resolveLanguageIcon("Go", {
      idPrefix: "req-42-",
      deps: { fetchImpl, cache },
    });
    for (const id of idsIn(visual.iconMarkup)) {
      expect(id.startsWith("req-42-")).toBe(true);
    }
  });

  test("the fallback glyph has no ids and issues no fetch", async () => {
    const { urls, fetchImpl, cache } = seam();
    const visual = await resolveLanguageIcon(null, {
      deps: { fetchImpl, cache },
    });
    expect(idsIn(visual.iconMarkup).size).toBe(0);
    expect(visual.iconMarkup).not.toContain("url(");
    expect(visual.iconMarkup).not.toContain("href");
    expect(urls).toHaveLength(0);
  });

  test("the result shape is total on every path", async () => {
    const paths: Array<Promise<LanguageVisual>> = [
      resolveLanguageIcon(null, { deps: seam() }),
      resolveLanguageIcon("Batchfile", { deps: seam() }),
      resolveLanguageIcon("Go", { deps: seam() }),
      resolveLanguageIcon("C", { deps: seam() }),
      resolveLanguageIcon("Rust", {
        deps: seam(() => new Response("", { status: 500 })),
      }),
    ];
    for (const pending of paths) {
      const visual = await pending;
      expectTotalShape(visual);
      expect(Object.values(visual).every((value) => value !== undefined)).toBe(
        true,
      );
    }
  });

  test("an achromatic language keeps its icon on the neutral tile", async () => {
    const { fetchImpl, cache } = seam();
    const visual = await resolveLanguageIcon("C", {
      deps: { fetchImpl, cache },
    });
    expect(visual.source).toBe("devicon");
    expect(visual.tileColor).toBe(FALLBACK_TILE_COLOR);
    expect(deriveTileColor("#555555")).toBe(FALLBACK_TILE_COLOR);
  });

  test("an unexpected internal exception falls back", async () => {
    const exploding: IconCache = {
      load() {
        throw new Error("cache exploded");
      },
      reset() {},
    };
    const visual = await resolveLanguageIcon("Go", {
      deps: { cache: exploding },
    });
    expect(visual.source).toBe("fallback");
    expect(visual.tileColor).toBe(FALLBACK_TILE_COLOR);
    expect(visual.language).toBe("Go");
    expectTotalShape(visual);
  });

  test("a rejecting cache also falls back", async () => {
    const rejecting: IconCache = {
      async load() {
        throw new Error("cache rejected");
      },
      reset() {},
    };
    const visual = await resolveLanguageIcon("Go", {
      deps: { cache: rejecting },
    });
    expect(visual.source).toBe("fallback");
  });
});
