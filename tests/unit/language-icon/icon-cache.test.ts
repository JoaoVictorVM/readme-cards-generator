import { describe, expect, test } from "bun:test";
import { ICON_FAILURE_TTL_MS } from "@/lib/language-icon/config";
import { createIconCache } from "@/lib/language-icon/icon-cache";
import type {
  FetchImplementation,
  LanguageIconDependencies,
} from "@/lib/language-icon/types";

function icon(marker: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"><path id="${marker}" d="M0 0"/></svg>`;
}

function counting(handler: (url: string) => Promise<Response> | Response): {
  urls: string[];
  fetchImpl: FetchImplementation;
} {
  const urls: string[] = [];
  return {
    urls,
    fetchImpl: async (url) => {
      urls.push(url);
      return handler(url);
    },
  };
}

function clockAt(value: { now: number }): () => number {
  return () => value.now;
}

describe("icon cache", () => {
  test("a second resolution performs no fetch", async () => {
    const cache = createIconCache();
    const { urls, fetchImpl } = counting(() => new Response(icon("a")));
    const deps: LanguageIconDependencies = { fetchImpl };
    await cache.load("go", "original", deps);
    await cache.load("go", "original", deps);
    expect(urls).toHaveLength(1);
  });

  test("concurrent misses share one fetch", async () => {
    const cache = createIconCache();
    const { urls, fetchImpl } = counting(
      () =>
        new Promise<Response>((resolve) =>
          setTimeout(() => resolve(new Response(icon("a"))), 10),
        ),
    );
    const results = await Promise.all(
      Array.from({ length: 10 }, () =>
        cache.load("go", "original", { fetchImpl }),
      ),
    );
    expect(urls).toHaveLength(1);
    for (const result of results) {
      expect(result.ok).toBe(true);
    }
  });

  test("distinct languages do not share entries", async () => {
    const cache = createIconCache();
    const { urls, fetchImpl } = counting(
      (url) => new Response(icon(url.includes("/go/") ? "go" : "rust")),
    );
    const first = await cache.load("go", "original", { fetchImpl });
    const second = await cache.load("rust", "original", { fetchImpl });
    expect(urls).toHaveLength(2);
    expect(first.ok && first.markup).toContain("go");
    expect(second.ok && second.markup).toContain("rust");
  });

  test("failure is negatively cached inside the ttl", async () => {
    const cache = createIconCache();
    const clock = { now: 1_000 };
    const { urls, fetchImpl } = counting(
      () => new Response("", { status: 404 }),
    );
    const deps: LanguageIconDependencies = { fetchImpl, now: clockAt(clock) };
    expect(await cache.load("go", "original", deps)).toEqual({
      ok: false,
      cause: "http_error",
    });
    clock.now += ICON_FAILURE_TTL_MS - 1;
    expect(await cache.load("go", "original", deps)).toEqual({
      ok: false,
      cause: "http_error",
    });
    expect(urls).toHaveLength(1);
  });

  test("failure is retried after the ttl", async () => {
    const cache = createIconCache();
    const clock = { now: 1_000 };
    let status = 404;
    const { urls, fetchImpl } = counting(() =>
      status === 404 ? new Response("", { status }) : new Response(icon("a")),
    );
    const deps: LanguageIconDependencies = { fetchImpl, now: clockAt(clock) };
    await cache.load("go", "original", deps);
    clock.now += ICON_FAILURE_TTL_MS + 1;
    status = 200;
    expect((await cache.load("go", "original", deps)).ok).toBe(true);
    expect(urls).toHaveLength(2);
  });

  test("a success entry does not expire", async () => {
    const cache = createIconCache();
    const clock = { now: 1_000 };
    const { urls, fetchImpl } = counting(() => new Response(icon("a")));
    const deps: LanguageIconDependencies = { fetchImpl, now: clockAt(clock) };
    await cache.load("go", "original", deps);
    clock.now += ICON_FAILURE_TTL_MS * 1_000;
    expect((await cache.load("go", "original", deps)).ok).toBe(true);
    expect(urls).toHaveLength(1);
  });

  test("reset clears all entries", async () => {
    const cache = createIconCache();
    const { urls, fetchImpl } = counting(() => new Response(icon("a")));
    await cache.load("go", "original", { fetchImpl });
    cache.reset();
    await cache.load("go", "original", { fetchImpl });
    expect(urls).toHaveLength(2);
  });

  test("cached markup carries the id sentinel rather than a prefix", async () => {
    const cache = createIconCache();
    const { fetchImpl } = counting(() => new Response(icon("a")));
    const result = await cache.load("go", "original", { fetchImpl });
    expect(result.ok && result.markup).toContain('id="__bgi_id__a"');
  });

  test("markup the sanitizer rejects is cached as malformed", async () => {
    const cache = createIconCache();
    const { urls, fetchImpl } = counting(
      () => new Response("<svg><path></svg>"),
    );
    const deps: LanguageIconDependencies = { fetchImpl };
    expect(await cache.load("go", "original", deps)).toEqual({
      ok: false,
      cause: "malformed",
    });
    await cache.load("go", "original", deps);
    expect(urls).toHaveLength(1);
  });
});
