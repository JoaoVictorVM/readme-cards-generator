import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  spyOn,
  test,
} from "bun:test";
import * as copyModule from "@/lib/card/copy";
import { renderCard } from "@/lib/card/render-card";
import { renderErrorCard } from "@/lib/card/render-error-card";
import { CARD_PALETTES } from "@/lib/card/themes";
import type { RenderCardInput } from "@/lib/card/types";
import { FALLBACK_TILE_COLOR } from "@/lib/language-icon/config";
import type { LanguageVisual } from "@/lib/language-icon/types";
import {
  LONG_NAME,
  NOW,
  REPOSITORY,
  backgroundRect,
  expectStandaloneSvg,
  expectZeroExternalReferences,
  isBalancedXml,
  rendererHrefs,
  textContent,
  visualFor,
} from "./helpers";

let javascript: LanguageVisual;
let go: LanguageVisual;
let fallback: LanguageVisual;

beforeAll(async () => {
  javascript = await visualFor("JavaScript");
  go = await visualFor("Go");
  fallback = await visualFor(null);
});

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

function input(overrides: Partial<RenderCardInput> = {}): RenderCardInput {
  return { repository: REPOSITORY, visual: javascript, now: NOW, ...overrides };
}

const NAME = (markup: string) => textContent(markup, 92, 42);
const ACTIVITY = (markup: string) => textContent(markup, 108, 66);
const LABEL = (markup: string, width = 380) =>
  textContent(markup, width / 2, 117);

describe("renderCard", () => {
  test("output is standalone svg with explicit dimensions", () => {
    for (const width of [280, 380, 600]) {
      expectStandaloneSvg(renderCard(input({ width })), width);
    }
  });

  test("zero external references", () => {
    for (const visual of [javascript, go, fallback]) {
      const markup = renderCard(input({ visual }));
      expectZeroExternalReferences(markup);
      expect(rendererHrefs(markup)).toEqual([
        "https://github.com/vercel/next.js",
      ]);
    }
  });

  test("no ids emitted by renderer", () => {
    expect(renderCard(input({ visual: fallback }))).not.toContain("id=");
    const markup = renderCard(input({ visual: go }));
    for (const match of markup.matchAll(/\bid="([^"]*)"/g)) {
      expect(match[1]!.startsWith("bgi-test")).toBe(true);
    }
  });

  test("long name is truncated with ellipsis", () => {
    const repository = { ...REPOSITORY, name: LONG_NAME };
    expect(NAME(renderCard(input({ repository })))).toBe(
      "some-extremely-long-reposi…",
    );
    const narrow = NAME(renderCard(input({ repository, width: 280 })));
    expect(narrow).toBe("some-extremely-l…");
    expect(Array.from(narrow).length).toBeLessThanOrEqual(17);
    expect(NAME(renderCard(input({ repository, width: 600 })))).toBe(LONG_NAME);
  });

  test("short name is not truncated", () => {
    const markup = renderCard(input());
    expect(NAME(markup)).toBe("next.js");
    expect(markup).not.toContain("…");
  });

  test("status dot green amber gray", () => {
    const cases: Array<[string, string]> = [
      ["2026-08-28T14:03:11Z", CARD_PALETTES.dark.dotGreen],
      ["2026-06-01T00:00:00Z", CARD_PALETTES.dark.dotAmber],
      ["2024-03-01T00:00:00Z", CARD_PALETTES.dark.dotGray],
    ];
    for (const [pushedAt, color] of cases) {
      const markup = renderCard(
        input({ repository: { ...REPOSITORY, pushedAt } }),
      );
      expect(markup).toContain(
        `<circle cx="97" cy="62" r="5" fill="${color}"/>`,
      );
    }
  });

  test("pt-BR copy", () => {
    const markup = renderCard(input({ locale: "pt-BR" }));
    expect(ACTIVITY(markup)).toBe("Atualizado há 10 dias");
    expect(LABEL(markup)).toBe("Ver repositório");
    const single = renderCard(
      input({
        locale: "pt-BR",
        repository: { ...REPOSITORY, pushedAt: "2026-09-07T23:30:00Z" },
      }),
    );
    expect(ACTIVITY(single)).toBe("Atualizado há 1 hora");
  });

  test("en copy", () => {
    const markup = renderCard(input({ locale: "en" }));
    expect(ACTIVITY(markup)).toBe("Updated 10 days ago");
    expect(LABEL(markup)).toBe("View Repository");
    expect(ACTIVITY(renderCard(input()))).toMatch(/^Updated .* ago$/);
    const unknown = renderCard(
      input({ repository: { ...REPOSITORY, pushedAt: "not-a-date" } }),
    );
    expect(ACTIVITY(unknown)).toBe("Last activity unknown");
    expect(unknown).toContain(`fill="${CARD_PALETTES.dark.dotGray}"`);
  });

  test("light theme palette", () => {
    const markup = renderCard(input({ theme: "light" }));
    expect(backgroundRect(markup)).toContain('fill="#ffffff"');
    expect(markup).toContain(`fill="${CARD_PALETTES.light.primary}"`);
    expect(markup).not.toContain(CARD_PALETTES.dark.surface);
    expect(markup).not.toContain(CARD_PALETTES.dark.primary);
  });

  test("dark theme is default", () => {
    expect(backgroundRect(renderCard(input()))).toContain(
      `fill="${CARD_PALETTES.dark.surface}"`,
    );
  });

  test("hostile name is escaped", () => {
    const name = `a<b>&c"d'e`;
    const repository = { ...REPOSITORY, name, fullName: `vercel/${name}` };
    const markup = renderCard(input({ repository }));
    expect(NAME(markup)).toBe("a&lt;b&gt;&amp;c&quot;d&#39;e");
    expect(markup).toContain(
      "<title>vercel/a&lt;b&gt;&amp;c&quot;d&#39;e</title>",
    );
    expect(isBalancedXml(markup)).toBe(true);
    expect(markup).not.toContain("<b>");
  });

  test("control characters are stripped from name", () => {
    const repository = { ...REPOSITORY, name: "next\u0001.js" };
    const markup = renderCard(input({ repository }));
    expect(NAME(markup)).toBe("next.js");
    expect(markup).not.toContain("\u0001");
  });

  test("tile geometry at every width", () => {
    for (const width of [280, 380, 480, 600]) {
      const markup = renderCard(input({ width }));
      expect(markup).toContain(
        `<rect x="20" y="20" width="56" height="56" rx="14" fill="${javascript.tileColor}"/>`,
      );
      expect(markup).toContain('<g transform="translate(32 32)"><svg');
    }
  });

  test("tile fill is the resolved color", () => {
    expect(renderCard(input({ visual: go }))).toContain(
      `rx="14" fill="${go.tileColor}"/>`,
    );
  });

  test("icon fragment is inlined verbatim with namespaces", () => {
    const markup = renderCard(input({ visual: go }));
    expect(go.iconMarkup).toContain("xmlns:xlink=");
    expect(markup).toContain(
      `<g transform="translate(32 32)">${go.iconMarkup}</g>`,
    );
    expect(markup.split(go.iconMarkup)).toHaveLength(2);
  });

  test("fallback visual renders neutral tile and glyph", () => {
    const markup = renderCard(input({ visual: fallback }));
    expect(markup).toContain(`fill="${FALLBACK_TILE_COLOR}"`);
    expect(markup).toContain("<polyline");
    expect(warnSpy).not.toHaveBeenCalled();
  });

  test("malformed icon markup is replaced by glyph", () => {
    const visual: LanguageVisual = { ...javascript, iconMarkup: "not svg" };
    const markup = renderCard(input({ visual }));
    expect(markup).not.toContain("not svg");
    expect(markup).toContain("<polyline");
    expect(markup).toContain(`fill="${javascript.tileColor}"`);
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(isBalancedXml(markup)).toBe(true);
  });

  test("button links to github url", () => {
    const markup = renderCard(input());
    const link = /<a href="([^"]*)">(.*?)<\/a>/.exec(markup);
    expect(link?.[1]).toBe("https://github.com/vercel/next.js");
    expect(link?.[2]).toContain(
      '<rect x="20" y="94" width="340" height="36" rx="8"',
    );
    expect(link?.[2]).toContain("View Repository</text>");
  });

  test("non github url renders button without link", () => {
    const repository = { ...REPOSITORY, htmlUrl: "http://evil.example/" };
    const markup = renderCard(input({ repository }));
    expect(markup).not.toContain("<a ");
    expect(rendererHrefs(markup)).toHaveLength(0);
    expect(markup).toContain(
      '<rect x="20" y="94" width="340" height="36" rx="8"',
    );
    expect(LABEL(markup)).toBe("View Repository");
  });

  test("title carries full name", () => {
    expect(renderCard(input())).toContain("<title>vercel/next.js</title>");
  });

  test("width is clamped and defaulted inside renderer", () => {
    expectStandaloneSvg(renderCard(input({ width: 9999 })), 600);
    expectStandaloneSvg(renderCard(input({ width: undefined })), 380);
    expectStandaloneSvg(renderCard(input({ width: 10 })), 280);
  });

  test("output is deterministic", () => {
    expect(renderCard(input())).toBe(renderCard(input()));
    expect(renderCard(input({ visual: go, locale: "pt-BR" }))).toBe(
      renderCard(input({ visual: go, locale: "pt-BR" })),
    );
  });

  test("uses injected now", () => {
    const later = NOW + 40 * 24 * 60 * 60 * 1000;
    expect(ACTIVITY(renderCard(input()))).toBe("Updated 10 days ago");
    expect(ACTIVITY(renderCard(input({ now: later })))).toBe(
      "Updated 1 month ago",
    );
  });

  test("never throws on missing input", () => {
    const broken = {
      repository: undefined,
      visual: javascript,
      width: 480,
    } as unknown as RenderCardInput;
    const markup = renderCard(broken);
    expect(markup).toBe(
      renderErrorCard({ kind: "unexpected_error", width: 480 }),
    );
    expectStandaloneSvg(markup, 480);
    expect(errorSpy).toHaveBeenCalledTimes(1);
    expect(renderCard(undefined as unknown as RenderCardInput)).toContain(
      "<svg",
    );
  });

  test("last resort frame when error card also fails", () => {
    const copySpy = spyOn(copyModule, "cardCopyFor").mockImplementation(() => {
      throw new Error("copy table unavailable");
    });
    try {
      const markup = renderCard(input());
      expect(markup.length).toBeGreaterThan(0);
      expect(markup.startsWith("<svg")).toBe(true);
      expect(markup.endsWith("</svg>")).toBe(true);
      expect(isBalancedXml(markup)).toBe(true);
      expect(errorSpy.mock.calls.length).toBeGreaterThanOrEqual(2);
    } finally {
      copySpy.mockRestore();
    }
  });
});
