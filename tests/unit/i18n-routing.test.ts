import { describe, expect, test } from "bun:test";
import {
  buildPath,
  getLocaleFromPathname,
  localeHome,
  switchLocalePath,
} from "@/i18n/routing";

describe("i18n routing", () => {
  test("root maps to en home", () => {
    expect(switchLocalePath("/", "en")).toBe("/en");
  });

  test("en home maps to root", () => {
    expect(switchLocalePath("/en", "pt-BR")).toBe("/");
  });

  test("gerar maps to en gerar", () => {
    expect(switchLocalePath("/gerar", "en")).toBe("/en/gerar");
  });

  test("en gerar maps to gerar", () => {
    expect(switchLocalePath("/en/gerar", "pt-BR")).toBe("/gerar");
  });

  test("round trip is identity", () => {
    for (const path of ["/", "/gerar", "/en", "/en/gerar"]) {
      const origin = getLocaleFromPathname(path);
      const other = origin === "en" ? "pt-BR" : "en";
      expect(switchLocalePath(switchLocalePath(path, other), origin)).toBe(
        path,
      );
    }
  });

  test("unknown path falls back to locale home", () => {
    expect(switchLocalePath("/nao-existe", "en")).toBe("/en");
    expect(switchLocalePath("/en/does-not-exist", "pt-BR")).toBe("/");
  });

  test("locale of pathname", () => {
    expect(getLocaleFromPathname("/en")).toBe("en");
    expect(getLocaleFromPathname("/en/gerar")).toBe("en");
    expect(getLocaleFromPathname("/")).toBe("pt-BR");
    expect(getLocaleFromPathname("/gerar")).toBe("pt-BR");
  });

  test("en prefix is not matched inside a segment", () => {
    expect(getLocaleFromPathname("/enviar")).toBe("pt-BR");
    expect(switchLocalePath("/enviar", "en")).toBe("/en");
  });

  test("locale home and build path", () => {
    expect(localeHome("pt-BR")).toBe("/");
    expect(localeHome("en")).toBe("/en");
    expect(buildPath("pt-BR", "gerar")).toBe("/gerar");
    expect(buildPath("en", "gerar")).toBe("/en/gerar");
    expect(buildPath("en", "")).toBe("/en");
  });

  test("trailing slashes are normalized", () => {
    expect(switchLocalePath("/gerar/", "en")).toBe("/en/gerar");
    expect(getLocaleFromPathname("/en/")).toBe("en");
  });
});
