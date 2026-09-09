import { describe, expect, test } from "bun:test";
import en from "@/i18n/dictionaries/en";
import ptBR from "@/i18n/dictionaries/pt-BR";
import { getDictionary } from "@/i18n/get-dictionary";

type Unknown = Record<string, unknown>;

function keyPaths(value: unknown, prefix = ""): string[] {
  if (typeof value !== "object" || value === null) return [prefix];
  return Object.entries(value as Unknown).flatMap(([key, child]) =>
    keyPaths(child, prefix ? `${prefix}.${key}` : key),
  );
}

function leaves(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (typeof value !== "object" || value === null) return [];
  return Object.values(value as Unknown).flatMap(leaves);
}

function tokens(value: string): string[] {
  return (value.match(/\{(\w+)\}/g) ?? []).sort();
}

describe("dictionaries", () => {
  test("dictionaries have identical key sets", () => {
    expect(keyPaths(en).sort()).toEqual(keyPaths(ptBR).sort());
  });

  test("no empty string values", () => {
    for (const value of [...leaves(ptBR), ...leaves(en)]) {
      expect(value.trim().length).toBeGreaterThan(0);
    }
  });

  test("get dictionary returns locale specific copy", () => {
    expect(getDictionary("pt-BR").errors.notFoundTitle).toBe(
      ptBR.errors.notFoundTitle,
    );
    expect(getDictionary("en").errors.notFoundTitle).toBe(
      en.errors.notFoundTitle,
    );
    expect(getDictionary("pt-BR").errors.notFoundTitle).not.toBe(
      getDictionary("en").errors.notFoundTitle,
    );
  });

  test("get dictionary rejects unknown locale", () => {
    expect(getDictionary("fr")).toBe(getDictionary("pt-BR"));
    expect(getDictionary(undefined)).toBe(getDictionary("pt-BR"));
  });

  test("placeholder tokens match across locales", () => {
    for (const path of keyPaths(ptBR)) {
      const source = path
        .split(".")
        .reduce<unknown>((acc, key) => (acc as Unknown)[key], ptBR);
      const target = path
        .split(".")
        .reduce<unknown>((acc, key) => (acc as Unknown)[key], en);
      if (typeof source === "string" && typeof target === "string") {
        expect(tokens(target)).toEqual(tokens(source));
      }
    }
  });
});
