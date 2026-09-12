import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  spyOn,
  test,
} from "bun:test";
import { CARD_COPY } from "@/lib/card/copy";
import { renderCard } from "@/lib/card/render-card";
import { renderErrorCard } from "@/lib/card/render-error-card";
import { CARD_PALETTES } from "@/lib/card/themes";
import {
  ERROR_CARD_KINDS,
  type ErrorCardKind,
  type RenderErrorCardInput,
} from "@/lib/card/types";
import type { LanguageVisual } from "@/lib/language-icon/types";
import {
  NOW,
  REPOSITORY,
  backgroundRect,
  expectStandaloneSvg,
  expectZeroExternalReferences,
  rendererHrefs,
  rootElement,
  textContent,
  visualFor,
} from "./helpers";

let javascript: LanguageVisual;

beforeAll(async () => {
  javascript = await visualFor("JavaScript");
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

const MESSAGE = (markup: string) => textContent(markup, 56, 80);
const KINDS = Object.values(ERROR_CARD_KINDS);

describe("renderErrorCard", () => {
  test("same frame and width as data card", () => {
    for (const theme of ["dark", "light"] as const) {
      for (const width of [280, 380, 600]) {
        const error = renderErrorCard({ kind: "not_found", theme, width });
        const card = renderCard({
          repository: REPOSITORY,
          visual: javascript,
          theme,
          width,
          now: NOW,
        });
        expect(rootElement(error)).toBe(rootElement(card));
        expect(backgroundRect(error)).toBe(backgroundRect(card));
        expectStandaloneSvg(error, width);
      }
    }
  });

  test("contains no action button", () => {
    const markup = renderErrorCard({ kind: "not_found" });
    expect(markup).not.toContain("<a ");
    expect(markup).not.toContain('y="94"');
    expect(markup).not.toContain("View Repository");
    expect(markup).not.toContain('rx="14"');
    expect(markup).not.toContain('<circle cx="97"');
    expect(rendererHrefs(markup)).toHaveLength(0);
  });

  test("every kind renders in both locales", () => {
    for (const locale of ["en", "pt-BR"] as const) {
      for (const kind of KINDS) {
        // At 600 every message fits its budget; the pt-BR too_many_requests
        // line is 46 characters and truncates at the default width.
        const markup = renderErrorCard({ kind, locale, width: 600 });
        const expected = CARD_COPY[locale].errors[kind];
        expect(MESSAGE(markup)).toBe(expected);
        expect(markup).toContain(`<title>${expected}</title>`);
      }
    }
  });

  test("warning glyph present", () => {
    for (const theme of ["dark", "light"] as const) {
      const markup = renderErrorCard({ kind: "upstream_error", theme });
      const glyph = /<g transform="translate\(20 63\)">(.*?)<\/g>/.exec(markup);
      expect(glyph).not.toBeNull();
      expect(glyph![1]).toContain("<path");
      expect(glyph![1]).toContain(CARD_PALETTES[theme].dotAmber);
    }
  });

  test("rate limited carries token hint desc", () => {
    const en = renderErrorCard({ kind: "rate_limited", locale: "en" });
    expect(en).toContain(`<desc>${CARD_COPY.en.hints.rate_limited}</desc>`);
    const ptBR = renderErrorCard({ kind: "rate_limited", locale: "pt-BR" });
    expect(ptBR).toContain(
      `<desc>${CARD_COPY["pt-BR"].hints.rate_limited}</desc>`,
    );
    for (const kind of KINDS.filter((k) => k !== "rate_limited")) {
      expect(renderErrorCard({ kind })).not.toContain("<desc>");
    }
  });

  test("long message truncated at minimum width", () => {
    const narrow = renderErrorCard({ kind: "too_many_requests", width: 280 });
    expect(MESSAGE(narrow)).toBe("Too many requests, try again …");
    expect(Array.from(MESSAGE(narrow))).toHaveLength(30);
    const normal = renderErrorCard({ kind: "too_many_requests", width: 380 });
    expect(MESSAGE(normal)).toBe("Too many requests, try again in a minute");
  });

  test("message is escaped", () => {
    for (const kind of KINDS) {
      const markup = renderErrorCard({ kind, locale: "pt-BR" });
      const title = /<title>([^<]*)<\/title>/.exec(markup)![1]!;
      expect(title).not.toMatch(/&(?!amp;|lt;|gt;|quot;|#39;)/);
      expect(MESSAGE(markup)).not.toMatch(/&(?!amp;|lt;|gt;|quot;|#39;)/);
    }
  });

  test("zero external references", () => {
    for (const kind of KINDS) {
      const markup = renderErrorCard({ kind, theme: "light" });
      expectZeroExternalReferences(markup);
      expect(markup).not.toContain("href");
    }
  });

  test("unknown kind renders unexpected error", () => {
    const markup = renderErrorCard({
      kind: "banana" as ErrorCardKind,
      locale: "en",
    });
    expect(MESSAGE(markup)).toBe(CARD_COPY.en.errors.unexpected_error);
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(errorSpy).not.toHaveBeenCalled();
  });

  test("output is standalone and deterministic", () => {
    for (const width of [280, 380, 600]) {
      const first = renderErrorCard({ kind: "not_found", width });
      expectStandaloneSvg(first, width);
      expect(renderErrorCard({ kind: "not_found", width })).toBe(first);
    }
  });

  test("never throws on missing input", () => {
    const markup = renderErrorCard(
      undefined as unknown as RenderErrorCardInput,
    );
    expect(markup.startsWith("<svg")).toBe(true);
    expect(markup.endsWith("</svg>")).toBe(true);
    expect(errorSpy).toHaveBeenCalledTimes(1);
    expect(MESSAGE(markup)).toBe(CARD_COPY.en.errors.unexpected_error);
  });
});
