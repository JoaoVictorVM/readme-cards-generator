import { describe, expect, test } from "bun:test";
import {
  LANGUAGE_TABLE,
  lookupLanguage,
} from "@/lib/language-icon/language-map";

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

describe("lookupLanguage", () => {
  test("covers the thirty PRD languages", () => {
    expect(PRD_LANGUAGES).toHaveLength(30);
    for (const language of PRD_LANGUAGES) {
      const entry = lookupLanguage(language);
      expect(entry).not.toBeNull();
      expect(entry!.slug.length).toBeGreaterThan(0);
      expect(entry!.color).toMatch(/^#[0-9a-f]{6}$/);
    }
  });

  test("lookup is case and whitespace insensitive", () => {
    const canonical = lookupLanguage("Go");
    expect(lookupLanguage(" go ")).toEqual(canonical!);
    expect(lookupLanguage("GO")).toEqual(canonical!);
  });

  test("aliases resolve to canonical entries", () => {
    expect(lookupLanguage("Objective-C++")!.slug).toBe("objectivec");
    expect(lookupLanguage("Sass")!.slug).toBe("sass");
    expect(lookupLanguage("LaTeX")!.slug).toBe("latex");
    expect(lookupLanguage("Bash")!.language).toBe("Shell");
    expect(lookupLanguage("HTML+ERB")!.slug).toBe("html5");
    expect(lookupLanguage("Vue.js")!.slug).toBe("vuejs");
    expect(lookupLanguage("C++17")!.slug).toBe("cplusplus");
    expect(lookupLanguage("C++20")!.slug).toBe("cplusplus");
    expect(lookupLanguage("Jupyter")!.language).toBe("Jupyter Notebook");
  });

  test("unmapped language returns no entry", () => {
    expect(lookupLanguage("Batchfile")).toBeNull();
    expect(lookupLanguage("Brainfuck")).toBeNull();
  });

  test("null and blank return no entry", () => {
    expect(lookupLanguage(null)).toBeNull();
    expect(lookupLanguage("")).toBeNull();
    expect(lookupLanguage("   ")).toBeNull();
  });

  test("every hex is parseable", () => {
    for (const entry of LANGUAGE_TABLE) {
      expect(entry.color).toMatch(/^#[0-9a-f]{6}$/);
    }
  });

  test("slugs are unique and lowercase", () => {
    const slugs = LANGUAGE_TABLE.map((entry) => entry.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs) {
      expect(slug).toMatch(/^[a-z0-9]+$/);
    }
  });

  test("language names are unique and the table meets the floor", () => {
    const names = LANGUAGE_TABLE.map((entry) => entry.language);
    expect(new Set(names).size).toBe(names.length);
    expect(LANGUAGE_TABLE.length).toBeGreaterThanOrEqual(30);
  });

  test("variant is declared for every row", () => {
    for (const entry of LANGUAGE_TABLE) {
      expect(["original", "plain"]).toContain(entry.variant);
    }
  });
});
