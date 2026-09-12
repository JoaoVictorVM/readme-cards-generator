import { describe, expect, test } from "bun:test";
import { buildCardPath } from "@/lib/repo-card/card-url";

describe("buildCardPath", () => {
  test("builds relative card path", () => {
    const path = buildCardPath("vercel", "next.js");
    expect(path).toBe("/api/repo/vercel/next.js");
    expect(path).not.toContain("?");
  });

  test("segments are percent-encoded", () => {
    const path = buildCardPath("a/b", "c d?e");
    expect(path).toBe("/api/repo/a%2Fb/c%20d%3Fe");
    expect(path.split("/")).toHaveLength(5);
  });
});
