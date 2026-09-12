import { describe, expect, test } from "bun:test";
import {
  resolveCardLocale,
  resolveCardTheme,
  resolveCardWidth,
} from "@/lib/card/options";

describe("resolveCardTheme", () => {
  test("theme defaults to dark", () => {
    for (const value of [undefined, "purple", 42, null, "", {}]) {
      expect(resolveCardTheme(value)).toBe("dark");
    }
  });

  test("theme accepts light", () => {
    expect(resolveCardTheme("light")).toBe("light");
    expect(resolveCardTheme("Light")).toBe("dark");
    expect(resolveCardTheme(" light")).toBe("dark");
  });
});

describe("resolveCardLocale", () => {
  test("locale defaults to en", () => {
    for (const value of [undefined, "fr", "pt", null, "pt-br", 1]) {
      expect(resolveCardLocale(value)).toBe("en");
    }
  });

  test("locale accepts pt-BR", () => {
    expect(resolveCardLocale("pt-BR")).toBe("pt-BR");
    expect(resolveCardLocale("en")).toBe("en");
  });
});

describe("resolveCardWidth", () => {
  test("width defaults to 380", () => {
    const inputs = [undefined, "abc", Number.NaN, null, Infinity, {}, "", " "];
    for (const value of inputs) {
      expect(resolveCardWidth(value)).toBe(380);
    }
  });

  test("width clamps low and high", () => {
    expect(resolveCardWidth(100)).toBe(280);
    expect(resolveCardWidth(9999)).toBe(600);
    expect(resolveCardWidth(-Infinity)).toBe(380);
  });

  test("width accepts numeric string", () => {
    expect(resolveCardWidth("480")).toBe(480);
    expect(resolveCardWidth(" 480 ")).toBe(480);
  });

  test("width rounds to integer", () => {
    expect(resolveCardWidth(379.6)).toBe(380);
    expect(resolveCardWidth("379.4")).toBe(379);
  });

  test("width bounds are inclusive", () => {
    expect(resolveCardWidth(280)).toBe(280);
    expect(resolveCardWidth(600)).toBe(600);
  });
});
