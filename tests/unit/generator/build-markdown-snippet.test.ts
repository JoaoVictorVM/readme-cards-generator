import { describe, expect, test } from "bun:test";
import {
  buildCardPath,
  buildCardUrl,
  buildMarkdownSnippet,
  buildRepositoryUrl,
} from "@/lib/generator";
import { buildCardPath as repoCardBuildCardPath } from "@/lib/repo-card/card-url";

describe("buildMarkdownSnippet", () => {
  test("snippet matches prd shape exactly", () => {
    expect(
      buildMarkdownSnippet("https://example.vercel.app", "vercel", "next.js"),
    ).toBe(
      "[![vercel/next.js](https://example.vercel.app/api/repo/vercel/next.js)](https://github.com/vercel/next.js)",
    );
  });

  test("snippet has no query string", () => {
    const pairs = [
      ["vercel", "next.js"],
      ["a-b", "c_d.e"],
      ["Owner", "Repo"],
    ];
    for (const [owner, repo] of pairs) {
      expect(
        buildMarkdownSnippet("http://localhost:3000", owner, repo),
      ).not.toContain("?");
    }
  });

  test("relative card path matches repo-card helper", () => {
    const pairs = [
      ["vercel", "next.js"],
      ["a-b", "c_d.e"],
      ["a/b", "c d?e"],
    ];
    for (const [owner, repo] of pairs) {
      expect(buildCardPath(owner, repo)).toBe(
        repoCardBuildCardPath(owner, repo),
      );
    }
  });

  test("origin without trailing slash is joined cleanly", () => {
    expect(buildCardUrl("http://localhost:3000", "vercel", "next.js")).toBe(
      "http://localhost:3000/api/repo/vercel/next.js",
    );
    expect(buildCardUrl("http://localhost:3000/", "vercel", "next.js")).toBe(
      "http://localhost:3000/api/repo/vercel/next.js",
    );
  });

  test("repository url uses github origin", () => {
    expect(buildRepositoryUrl("vercel", "next.js")).toBe(
      "https://github.com/vercel/next.js",
    );
  });
});
