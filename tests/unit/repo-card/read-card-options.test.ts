import { describe, expect, test } from "bun:test";
import { readCardOptions } from "@/lib/repo-card/read-card-options";
import type { RepoCardOptions } from "@/lib/repo-card/types";

const DEFAULTS: RepoCardOptions = { theme: "dark", locale: "en", width: 380 };

function request(query: string): Request {
  return new Request(`http://localhost/api/repo/vercel/next.js${query}`);
}

describe("readCardOptions", () => {
  test("defaults when no query", () => {
    expect(readCardOptions(request(""))).toEqual(DEFAULTS);
  });

  test("reads all three parameters", () => {
    expect(
      readCardOptions(request("?theme=light&locale=pt-BR&width=480")),
    ).toEqual({ theme: "light", locale: "pt-BR", width: 480 });
  });

  test("unrecognized values fall back", () => {
    expect(
      readCardOptions(request("?theme=purple&locale=fr&width=abc")),
    ).toEqual(DEFAULTS);
  });

  test("width clamps low and high", () => {
    expect(readCardOptions(request("?width=100")).width).toBe(280);
    expect(readCardOptions(request("?width=9999")).width).toBe(600);
  });

  test("width rounds fractional values", () => {
    expect(readCardOptions(request("?width=379.6")).width).toBe(380);
  });

  test("case sensitive matching", () => {
    expect(readCardOptions(request("?theme=Light&locale=pt-br"))).toEqual(
      DEFAULTS,
    );
  });

  test("first occurrence wins when repeated", () => {
    expect(readCardOptions(request("?theme=light&theme=dark")).theme).toBe(
      "light",
    );
  });

  test("unknown parameters are ignored", () => {
    const options = readCardOptions(request("?owner=x&foo=bar"));
    expect(options).toEqual(DEFAULTS);
    expect(Object.keys(options).sort()).toEqual(["locale", "theme", "width"]);
  });

  test("never throws", () => {
    expect(readCardOptions(request("?theme=%E0%A4%A&width=%"))).toEqual(
      DEFAULTS,
    );
  });
});
