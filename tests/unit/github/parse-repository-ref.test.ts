import { describe, expect, test } from "bun:test";
import { parseRepositoryRef } from "@/lib/github/parse-repository-ref";

describe("parseRepositoryRef", () => {
  test("accepts plain owner and repo", () => {
    const result = parseRepositoryRef("vercel", "nextjs");
    expect(result).toEqual({
      ok: true,
      data: { owner: "vercel", repo: "nextjs" },
    });
  });

  test("accepts dots, dashes and underscores", () => {
    for (const segment of ["next.js", "my-repo", "my_repo", "a.b-c_d"]) {
      expect(parseRepositoryRef(segment, segment).ok).toBe(true);
    }
  });

  test("rejects slash in segment", () => {
    expect(parseRepositoryRef("vercel/next", "next.js").ok).toBe(false);
    expect(parseRepositoryRef("vercel", "next/js").ok).toBe(false);
  });

  test("rejects path traversal and query characters", () => {
    for (const segment of ["..", "%2e", "a?b", "a#b", "a@b", "a b", "a\b"]) {
      expect(parseRepositoryRef(segment, "repo").ok).toBe(false);
      expect(parseRepositoryRef("owner", segment).ok).toBe(false);
    }
  });

  test("rejects empty segment", () => {
    expect(parseRepositoryRef("", "repo").ok).toBe(false);
    expect(parseRepositoryRef("owner", "").ok).toBe(false);
    expect(parseRepositoryRef("   ", "repo").ok).toBe(false);
  });

  test("rejects segment over one hundred characters", () => {
    const hundred = "a".repeat(100);
    expect(parseRepositoryRef(hundred, hundred).ok).toBe(true);
    expect(parseRepositoryRef(`${hundred}a`, "repo").ok).toBe(false);
  });

  test("reports which segment failed", () => {
    const badOwner = parseRepositoryRef("bad owner", "repo");
    const badRepo = parseRepositoryRef("owner", "bad repo");
    expect(badOwner.ok).toBe(false);
    expect(badRepo.ok).toBe(false);
    if (badOwner.ok || badRepo.ok) throw new Error("expected failures");
    expect(badOwner.error).toBe("invalid_owner");
    expect(badRepo.error).toBe("invalid_repo");
  });
});
