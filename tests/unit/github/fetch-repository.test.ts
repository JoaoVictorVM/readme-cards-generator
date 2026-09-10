import { afterEach, beforeEach, describe, expect, spyOn, test } from "bun:test";
import { fetchRepository } from "@/lib/github/fetch-repository";
import { GITHUB_REQUEST_TIMEOUT_MS } from "@/lib/github/config";
import type { FetchImplementation } from "@/lib/github/types";

const payload = {
  name: "next.js",
  full_name: "vercel/next.js",
  owner: { login: "vercel" },
  language: "JavaScript",
  pushed_at: "2026-08-28T14:03:11Z",
  html_url: "https://github.com/vercel/next.js",
  stargazers_count: 120000,
};

type Call = { url: string; init: RequestInit };

function recorder(handler: (call: Call) => Promise<Response> | Response) {
  const calls: Call[] = [];
  const fetchImpl: FetchImplementation = async (url, init) => {
    const call = { url, init };
    calls.push(call);
    return handler(call);
  };
  return { calls, fetchImpl };
}

function jsonResponse(body: unknown, status = 200, headers?: HeadersInit) {
  return new Response(JSON.stringify(body), { status, headers });
}

let warnSpy: ReturnType<typeof spyOn>;
let errorSpy: ReturnType<typeof spyOn>;

beforeEach(() => {
  warnSpy = spyOn(console, "warn").mockImplementation(() => {});
  errorSpy = spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  warnSpy.mockRestore();
  errorSpy.mockRestore();
});

describe("fetchRepository", () => {
  test("existing repository returns ok with six fields", async () => {
    const { calls, fetchImpl } = recorder(() => jsonResponse(payload));
    const outcome = await fetchRepository("vercel", "next.js", { fetchImpl });
    expect(outcome).toEqual({
      status: "ok",
      data: {
        owner: "vercel",
        name: "next.js",
        fullName: "vercel/next.js",
        language: "JavaScript",
        pushedAt: "2026-08-28T14:03:11Z",
        htmlUrl: "https://github.com/vercel/next.js",
      },
    });
    expect(calls).toHaveLength(1);
    expect(calls[0]!.url).toBe("https://api.github.com/repos/vercel/next.js");
  });

  test("nonexistent repository returns not_found without retry", async () => {
    const { calls, fetchImpl } = recorder(
      () => new Response("", { status: 404 }),
    );
    const outcome = await fetchRepository("vercel", "ghost", { fetchImpl });
    expect(outcome).toEqual({ status: "not_found" });
    expect(calls).toHaveLength(1);
  });

  test("rate limited response returns rate_limited without retry", async () => {
    const { calls, fetchImpl } = recorder(
      () =>
        new Response("", {
          status: 403,
          headers: {
            "x-ratelimit-remaining": "0",
            "x-ratelimit-reset": "1788269000",
          },
        }),
    );
    const outcome = await fetchRepository("vercel", "next.js", {
      fetchImpl,
      now: () => 1788268953000,
    });
    expect(outcome).toEqual({
      status: "rate_limited",
      resetAt: 1788269000000,
      retryAfterSeconds: 47,
    });
    expect(calls).toHaveLength(1);
  });

  test("service unavailable returns upstream_error", async () => {
    const { fetchImpl } = recorder(() => new Response("", { status: 503 }));
    expect(await fetchRepository("vercel", "next.js", { fetchImpl })).toEqual({
      status: "upstream_error",
      reason: "http_status",
      httpStatus: 503,
    });
  });

  test(
    "timeout aborts and returns upstream_error",
    async () => {
      const { calls, fetchImpl } = recorder(
        (call) =>
          new Promise<Response>((_resolve, reject) => {
            call.init.signal?.addEventListener("abort", () =>
              reject(new DOMException("aborted", "AbortError")),
            );
          }),
      );
      const started = Date.now();
      const outcome = await fetchRepository("vercel", "next.js", { fetchImpl });
      const elapsed = Date.now() - started;
      expect(outcome).toEqual({
        status: "upstream_error",
        reason: "timeout",
        httpStatus: null,
      });
      expect(calls[0]!.init.signal?.aborted).toBe(true);
      expect(elapsed).toBeGreaterThanOrEqual(GITHUB_REQUEST_TIMEOUT_MS - 100);
      expect(elapsed).toBeLessThan(GITHUB_REQUEST_TIMEOUT_MS + 2000);
    },
    GITHUB_REQUEST_TIMEOUT_MS + 5000,
  );

  test("transport failure returns upstream_error", async () => {
    const { fetchImpl } = recorder(() =>
      Promise.reject(new TypeError("fetch failed")),
    );
    expect(await fetchRepository("vercel", "next.js", { fetchImpl })).toEqual({
      status: "upstream_error",
      reason: "network",
      httpStatus: null,
    });
  });

  test("invalid json returns unexpected_error", async () => {
    const { fetchImpl } = recorder(
      () => new Response("<html>nope</html>", { status: 200 }),
    );
    expect(await fetchRepository("vercel", "next.js", { fetchImpl })).toEqual({
      status: "unexpected_error",
      reason: "invalid_json",
    });
  });

  test("missing fields returns unexpected_error", async () => {
    const { fetchImpl } = recorder(() => jsonResponse({ name: "next.js" }));
    expect(await fetchRepository("vercel", "next.js", { fetchImpl })).toEqual({
      status: "unexpected_error",
      reason: "missing_fields",
    });
  });

  test("invalid ref returns unexpected_error with no network call", async () => {
    const { calls, fetchImpl } = recorder(() => jsonResponse(payload));
    expect(await fetchRepository("ver cel", "next.js", { fetchImpl })).toEqual({
      status: "unexpected_error",
      reason: "invalid_ref",
    });
    expect(await fetchRepository("vercel", "next/js", { fetchImpl })).toEqual({
      status: "unexpected_error",
      reason: "invalid_ref",
    });
    expect(calls).toHaveLength(0);
  });

  test("never throws on any seam failure", async () => {
    const throwing: FetchImplementation = () => {
      throw new Error("boom");
    };
    const rejectingNonError: FetchImplementation = () =>
      Promise.reject("not an error");
    expect(
      await fetchRepository("vercel", "next.js", { fetchImpl: throwing }),
    ).toEqual({ status: "unexpected_error", reason: "thrown" });
    expect(
      await fetchRepository("vercel", "next.js", {
        fetchImpl: rejectingNonError,
      }),
    ).toEqual({ status: "unexpected_error", reason: "thrown" });
  });

  test("outcome union is exhaustive and carries nothing extra", async () => {
    const cases: Array<[FetchImplementation, string[]]> = [
      [async () => jsonResponse(payload), ["status", "data"]],
      [async () => new Response("", { status: 404 }), ["status"]],
      [
        async () =>
          new Response("", {
            status: 429,
            headers: { "x-ratelimit-remaining": "0" },
          }),
        ["status", "resetAt", "retryAfterSeconds"],
      ],
      [
        async () => new Response("", { status: 500 }),
        ["status", "reason", "httpStatus"],
      ],
      [async () => jsonResponse({}), ["status", "reason"]],
    ];
    for (const [fetchImpl, keys] of cases) {
      const outcome = await fetchRepository("vercel", "next.js", { fetchImpl });
      expect(Object.keys(outcome).sort()).toEqual([...keys].sort());
      expect([
        "ok",
        "not_found",
        "rate_limited",
        "upstream_error",
        "unexpected_error",
      ]).toContain(outcome.status);
    }
  });

  test("raw payload never escapes", async () => {
    const { fetchImpl } = recorder(() => jsonResponse(payload));
    const outcome = await fetchRepository("vercel", "next.js", { fetchImpl });
    if (outcome.status !== "ok") throw new Error("expected ok");
    expect(Object.keys(outcome.data)).not.toContain("stargazers_count");
    expect(JSON.stringify(outcome)).not.toContain("stargazers_count");
  });

  test("token override drives the authorization header", async () => {
    const { calls, fetchImpl } = recorder(() => jsonResponse(payload));
    await fetchRepository("vercel", "next.js", { fetchImpl, token: "ghp_x" });
    const headers = calls[0]!.init.headers as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer ghp_x");
  });

  test("oversized body returns unexpected_error", async () => {
    const { fetchImpl } = recorder(
      () =>
        new Response(JSON.stringify(payload), {
          status: 200,
          headers: { "content-length": String(50 * 1024 * 1024) },
        }),
    );
    expect(await fetchRepository("vercel", "next.js", { fetchImpl })).toEqual({
      status: "unexpected_error",
      reason: "invalid_json",
    });
  });
});
