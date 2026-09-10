import { describe, expect, test } from "bun:test";
import { normalizeRepository } from "@/lib/github/normalize-repository";

const payload = {
  id: 70107786,
  name: "next.js",
  full_name: "vercel/next.js",
  owner: { login: "vercel", id: 14985020, type: "Organization" },
  private: false,
  language: "JavaScript",
  pushed_at: "2026-08-28T14:03:11Z",
  html_url: "https://github.com/vercel/next.js",
  stargazers_count: 120000,
  default_branch: "canary",
};

describe("normalizeRepository", () => {
  test("normalizes a full payload to six fields", () => {
    const result = normalizeRepository(payload);
    if (!result.ok) throw new Error("expected success");
    expect(Object.keys(result.data).sort()).toEqual([
      "fullName",
      "htmlUrl",
      "language",
      "name",
      "owner",
      "pushedAt",
    ]);
  });

  test("maps owner.login to owner", () => {
    const result = normalizeRepository(payload);
    if (!result.ok) throw new Error("expected success");
    expect(result.data.owner).toBe("vercel");
  });

  test("preserves pushed_at as an ISO string", () => {
    const result = normalizeRepository(payload);
    if (!result.ok) throw new Error("expected success");
    expect(result.data.pushedAt).toBe("2026-08-28T14:03:11Z");
    expect(typeof result.data.pushedAt).toBe("string");
  });

  test("null language is preserved", () => {
    const result = normalizeRepository({ ...payload, language: null });
    if (!result.ok) throw new Error("expected success");
    expect(result.data.language).toBeNull();
  });

  test("missing required field rejected", () => {
    for (const field of [
      "name",
      "full_name",
      "html_url",
      "pushed_at",
      "owner",
    ]) {
      const body: Record<string, unknown> = { ...payload };
      delete body[field];
      expect(normalizeRepository(body).ok).toBe(false);
    }
  });

  test("wrong typed field rejected", () => {
    expect(normalizeRepository({ ...payload, name: 42 }).ok).toBe(false);
    expect(normalizeRepository({ ...payload, full_name: {} }).ok).toBe(false);
    expect(normalizeRepository({ ...payload, html_url: null }).ok).toBe(false);
    expect(normalizeRepository({ ...payload, owner: "vercel" }).ok).toBe(false);
    expect(normalizeRepository({ ...payload, language: 7 }).ok).toBe(false);
  });

  test("empty string required field rejected", () => {
    expect(normalizeRepository({ ...payload, name: "" }).ok).toBe(false);
    expect(normalizeRepository({ ...payload, full_name: "   " }).ok).toBe(
      false,
    );
  });

  test("unparseable pushed_at rejected", () => {
    expect(
      normalizeRepository({ ...payload, pushed_at: "not-a-date" }).ok,
    ).toBe(false);
  });

  test("non-object body rejected", () => {
    expect(normalizeRepository([payload]).ok).toBe(false);
    expect(normalizeRepository("payload").ok).toBe(false);
    expect(normalizeRepository(null).ok).toBe(false);
    expect(normalizeRepository(undefined).ok).toBe(false);
  });

  test("failure names the offending field", () => {
    const result = normalizeRepository({ ...payload, pushed_at: "nope" });
    if (result.ok) throw new Error("expected failure");
    expect(result.error).toBe("missing_fields");
    expect(result.detail).toBe("pushed_at");
  });
});
