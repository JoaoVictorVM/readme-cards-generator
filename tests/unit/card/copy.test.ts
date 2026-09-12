import { describe, expect, test } from "bun:test";
import { CARD_COPY, cardCopyFor } from "@/lib/card/copy";
import { ERROR_CARD_KINDS } from "@/lib/card/types";

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

const ptBR = CARD_COPY["pt-BR"];
const en = CARD_COPY.en;

describe("card copy", () => {
  test("locales have identical key sets", () => {
    expect(keyPaths(en).sort()).toEqual(keyPaths(ptBR).sort());
    expect(keyPaths(ptBR).sort()).toEqual(keyPaths(en).sort());
  });

  test("no empty values", () => {
    for (const value of [...leaves(ptBR), ...leaves(en)]) {
      expect(value.trim().length).toBeGreaterThan(0);
    }
  });

  test("activity templates carry both placeholders", () => {
    for (const copy of [ptBR, en]) {
      expect(copy.activityTemplate.match(/\{n\}/g)).toHaveLength(1);
      expect(copy.activityTemplate.match(/\{unit\}/g)).toHaveLength(1);
    }
  });

  test("every unit has singular and plural", () => {
    for (const copy of [ptBR, en]) {
      for (const unit of ["hour", "day", "month", "year"] as const) {
        const forms = copy.units[unit];
        expect(forms.one.length).toBeGreaterThan(0);
        expect(forms.many.length).toBeGreaterThan(0);
        expect(forms.one).not.toBe(forms.many);
      }
    }
  });

  test("every error kind has a message", () => {
    for (const copy of [ptBR, en]) {
      for (const kind of Object.values(ERROR_CARD_KINDS)) {
        expect(copy.errors[kind].length).toBeGreaterThan(0);
      }
    }
  });

  test("button labels match prd", () => {
    expect(en.buttonLabel).toBe("View Repository");
    expect(ptBR.buttonLabel).toBe("Ver repositório");
  });

  test("unknown locale returns en", () => {
    for (const value of [undefined, null, "fr", "pt", "pt-br"]) {
      expect(cardCopyFor(value)).toBe(en);
    }
    expect(cardCopyFor("pt-BR")).toBe(ptBR);
  });
});
