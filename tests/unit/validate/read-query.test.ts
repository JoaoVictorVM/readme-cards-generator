import { describe, expect, test } from "bun:test";
import { readQuery } from "@/lib/validate/read-query";

function request(query: string): Request {
  return new Request(`http://localhost/api/validate${query}`);
}

describe("readQuery", () => {
  test("reads both parameters", () => {
    const result = readQuery(request("?owner=a&repo=b"));
    expect(result).toEqual({ ok: true, data: { owner: "a", repo: "b" } });
  });

  test("missing owner is invalid_input", () => {
    const result = readQuery(request("?repo=b"));
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBe("invalid_input");
    expect(result.detail).toBe("owner");
  });

  test("missing repo is invalid_input", () => {
    const result = readQuery(request("?owner=a"));
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBe("invalid_input");
    expect(result.detail).toBe("repo");
  });

  test("empty value is invalid_input", () => {
    expect(readQuery(request("?owner=&repo=b")).ok).toBe(false);
    expect(readQuery(request("?owner=a&repo=")).ok).toBe(false);
    expect(readQuery(request("")).ok).toBe(false);
  });

  test("first occurrence wins when repeated", () => {
    const result = readQuery(request("?owner=a&owner=c&repo=b"));
    expect(result).toEqual({ ok: true, data: { owner: "a", repo: "b" } });
  });

  test("values are not trimmed", () => {
    const result = readQuery(request("?owner=%20a&repo=b%20"));
    expect(result).toEqual({ ok: true, data: { owner: " a", repo: "b " } });
  });

  test("unknown parameters are ignored", () => {
    const result = readQuery(request("?owner=a&repo=b&theme=light"));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(Object.keys(result.data).sort()).toEqual(["owner", "repo"]);
  });
});
