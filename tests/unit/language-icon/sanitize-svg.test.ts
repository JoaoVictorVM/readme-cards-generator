import { readFileSync } from "node:fs";
import { describe, expect, test } from "bun:test";
import { sanitizeSvg } from "@/lib/language-icon/sanitize-svg";

const FIXTURES = "tests/fixtures/devicon";

function fixture(name: string): string {
  return readFileSync(`${FIXTURES}/${name}`, "utf8");
}

function sanitize(source: string): string {
  const result = sanitizeSvg(source);
  expect(result.ok).toBe(true);
  return result.ok ? result.markup : "";
}

const HOSTILE = fixture("hostile.svg");

describe("sanitizeSvg", () => {
  test("script element is removed with its subtree", () => {
    const markup = sanitize(HOSTILE);
    expect(markup).not.toContain("<script");
    expect(markup).not.toContain("document.cookie");
  });

  test("event handler attributes are removed", () => {
    const markup = sanitize(HOSTILE);
    expect(markup).not.toContain("onload");
    expect(markup).not.toContain("onclick");
    expect(markup).not.toMatch(/\son[a-z]+=/i);
  });

  test("javascript url is removed", () => {
    const markup = sanitize(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"><use href="javascript:alert(1)"/><rect width="1" height="1"/></svg>',
    );
    expect(markup).not.toContain("javascript:");
  });

  test("data url is removed", () => {
    const markup = sanitize(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"><rect width="1" height="1" fill="data:image/png;base64,AAA"/></svg>',
    );
    expect(markup).not.toContain("data:");
  });

  test("image element is removed", () => {
    const markup = sanitize(HOSTILE);
    expect(markup).not.toContain("<image");
    expect(markup).not.toContain("tracker.png");
  });

  test("remote use reference is removed and a local one survives", () => {
    const markup = sanitize(HOSTILE);
    expect(markup).not.toContain("sprite.svg");
    expect(markup).toContain('<use href="#grad"/>');
  });

  test("external url function is removed while a local one survives", () => {
    const markup = sanitize(HOSTILE);
    expect(markup).not.toContain("url(https://");
    expect(markup).toContain('fill="url(#grad)"');
  });

  test("style attribute with an external url is dropped", () => {
    const markup = sanitize(HOSTILE);
    expect(markup).toContain('style="fill:#00add8"');
    expect(markup).not.toContain("p.svg");
  });

  test("foreign object is removed", () => {
    const markup = sanitize(HOSTILE);
    expect(markup).not.toContain("foreignObject");
    expect(markup).not.toContain("escape");
  });

  test("unknown element is removed with its subtree", () => {
    const markup = sanitize(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"><filter id="f"><feFlood/></filter><rect width="1" height="1"/></svg>',
    );
    expect(markup).not.toContain("filter");
    expect(markup).not.toContain("feFlood");
    expect(markup).toContain("<rect");
  });

  test("unknown attribute is removed while the element survives", () => {
    const markup = sanitize(HOSTILE);
    expect(markup).not.toContain("data-tracking");
    expect(markup).toContain('<rect width="8" height="8" fill="#fff"/>');
  });

  test("root namespace declarations are preserved", () => {
    const markup = sanitize(fixture("go-original.svg"));
    expect(markup).toContain('xmlns="http://www.w3.org/2000/svg"');
    expect(markup).toContain('xmlns:xlink="http://www.w3.org/1999/xlink"');
  });

  test("viewBox is preserved and the size is normalized", () => {
    const markup = sanitize(fixture("go-original.svg"));
    expect(markup).toContain('viewBox="0 0 128 128"');
    expect(markup).toContain('width="32" height="32"');
    expect(markup).toContain('preserveAspectRatio="xMidYMid meet"');
    const root = markup.slice(0, markup.indexOf(">"));
    expect(root).not.toMatch(/\sx="/);
    expect(root).not.toMatch(/\sy="/);
  });

  test("root x and y are dropped even when the source declares them", () => {
    const root = sanitize(HOSTILE).slice(0, sanitize(HOSTILE).indexOf(">"));
    expect(root).not.toMatch(/\sx="/);
    expect(root).not.toMatch(/\sy="/);
    expect(root).toContain('viewBox="0 0 64 64"');
  });

  test("gradients and clip paths survive", () => {
    const markup = sanitize(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"><defs>' +
        '<linearGradient id="a"><stop offset="0" stop-color="#fff"/></linearGradient>' +
        '<radialGradient id="b"><stop offset="1" stop-color="#000"/></radialGradient>' +
        '<clipPath id="c"><rect width="1" height="1"/></clipPath>' +
        '<mask id="d"><rect width="1" height="1"/></mask>' +
        '</defs><path d="M0 0"/></svg>',
    );
    for (const element of [
      "<defs>",
      "<linearGradient",
      "<radialGradient",
      "<stop",
      "<clipPath",
      "<mask",
    ]) {
      expect(markup).toContain(element);
    }
  });

  test("empty or multi-root input is malformed", () => {
    expect(sanitizeSvg("")).toEqual({ ok: false, cause: "malformed" });
    expect(sanitizeSvg("<html><body>nope</body></html>")).toEqual({
      ok: false,
      cause: "malformed",
    });
    expect(
      sanitizeSvg(
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"/><svg viewBox="0 0 1 1"/>',
      ),
    ).toEqual({ ok: false, cause: "malformed" });
  });

  test("unbalanced markup is malformed", () => {
    expect(
      sanitizeSvg('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1">'),
    ).toEqual({ ok: false, cause: "malformed" });
  });

  test("prolog, doctype and comments are stripped", () => {
    const markup = sanitize(HOSTILE);
    expect(markup.startsWith("<svg")).toBe(true);
    expect(markup).not.toContain("<?xml");
    expect(markup).not.toContain("<!DOCTYPE");
    expect(markup).not.toContain("<!--");
  });

  test("output of the go fixture is stable", () => {
    expect(sanitize(fixture("go-original.svg"))).toBe(
      fixture("go-original.sanitized.svg"),
    );
  });

  test("removed content is reported to the caller", () => {
    const result = sanitizeSvg(HOSTILE);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.removed).toContain("script");
    expect(result.removed).toContain("image");
    expect(result.removed).toContain("@onload");
  });
});
