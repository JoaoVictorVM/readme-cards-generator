import { describe, expect, test } from "bun:test";
import { requestValidation, type RequestResolution } from "@/lib/generator";

type FetchCall = { url: string; init: RequestInit | undefined };

function jsonResponse(
  status: number,
  body: unknown,
  headers: Record<string, string> = {},
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...headers },
  });
}

function fakeFetch(
  handler: (call: FetchCall) => Promise<Response> | Response,
): { calls: FetchCall[]; fn: typeof fetch } {
  const calls: FetchCall[] = [];
  const fn = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const call = { url: String(input), init };
    calls.push(call);
    return handler(call);
  }) as typeof fetch;
  return { calls, fn };
}

const SUCCESS = { exists: true, owner: "vercel", repo: "next.js" };

describe("requestValidation", () => {
  test("builds expected url and options", async () => {
    const fetcher = fakeFetch(() => jsonResponse(200, SUCCESS));
    await requestValidation("Vercel", "Next.js", {
      fetchImplementation: fetcher.fn,
    });
    expect(fetcher.calls).toHaveLength(1);
    const [{ url, init }] = fetcher.calls;
    expect(url).toBe("/api/validate?owner=Vercel&repo=Next.js");
    expect(init?.cache).toBe("no-store");
    expect(init?.method).toBe("GET");
    expect(new Headers(init?.headers).get("Accept")).toBe("application/json");
    expect(init?.signal).toBeInstanceOf(AbortSignal);
  });

  test("encodes parameters", async () => {
    const fetcher = fakeFetch(() => jsonResponse(200, SUCCESS));
    await requestValidation("a-b", "c d.e", {
      fetchImplementation: fetcher.fn,
    });
    expect(fetcher.calls[0].url).toBe("/api/validate?owner=a-b&repo=c+d.e");
  });

  test("success response resolves ok", async () => {
    const fetcher = fakeFetch(() => jsonResponse(200, SUCCESS));
    const outcome = await requestValidation("Vercel", "Next.js", {
      fetchImplementation: fetcher.fn,
    });
    expect(outcome).toEqual({ status: "ok", owner: "vercel", repo: "next.js" });
  });

  test("error statuses resolve classified errors", async () => {
    const cases: Array<{ response: Response; expected: RequestResolution }> = [
      {
        response: jsonResponse(404, { exists: false, error: "not_found" }),
        expected: { status: "error", kind: "not_found" },
      },
      {
        response: jsonResponse(
          429,
          { exists: false, error: "rate_limited" },
          { "Retry-After": "37" },
        ),
        expected: {
          status: "error",
          kind: "too_many_requests",
          retryAfterSeconds: 37,
        },
      },
      {
        response: jsonResponse(502, { exists: false, error: "upstream_error" }),
        expected: { status: "error", kind: "could_not_verify" },
      },
    ];
    for (const { response, expected } of cases) {
      const fetcher = fakeFetch(() => response);
      const outcome = await requestValidation("vercel", "next.js", {
        fetchImplementation: fetcher.fn,
      });
      expect(outcome).toEqual(expected);
    }
  });

  test("non-json body is could_not_verify", async () => {
    const fetcher = fakeFetch(
      () => new Response("<html>oops</html>", { status: 200 }),
    );
    const outcome = await requestValidation("vercel", "next.js", {
      fetchImplementation: fetcher.fn,
    });
    expect(outcome).toEqual({ status: "error", kind: "could_not_verify" });
  });

  test("network failure is could_not_verify", async () => {
    const fetcher = fakeFetch(() => {
      throw new TypeError("Failed to fetch");
    });
    const outcome = await requestValidation("vercel", "next.js", {
      fetchImplementation: fetcher.fn,
    });
    expect(outcome).toEqual({ status: "error", kind: "could_not_verify" });
  });

  test("timeout is could_not_verify", async () => {
    let signal: AbortSignal | undefined;
    const fetcher = fakeFetch(
      ({ init }) =>
        new Promise<Response>((_, reject) => {
          signal = init?.signal ?? undefined;
          signal?.addEventListener("abort", () =>
            reject(new DOMException("aborted", "AbortError")),
          );
        }),
    );
    const outcome = await requestValidation("vercel", "next.js", {
      fetchImplementation: fetcher.fn,
      timeoutMs: 10,
    });
    expect(outcome).toEqual({ status: "error", kind: "could_not_verify" });
    expect(signal?.aborted).toBe(true);
  });

  test("caller abort is aborted marker", async () => {
    const controller = new AbortController();
    const fetcher = fakeFetch(
      ({ init }) =>
        new Promise<Response>((_, reject) => {
          init?.signal?.addEventListener("abort", () =>
            reject(new DOMException("aborted", "AbortError")),
          );
        }),
    );
    const pending = requestValidation("vercel", "next.js", {
      fetchImplementation: fetcher.fn,
      signal: controller.signal,
    });
    controller.abort();
    expect(await pending).toEqual({ status: "aborted" });
  });

  test("already aborted signal resolves aborted without fetching", async () => {
    const controller = new AbortController();
    controller.abort();
    const fetcher = fakeFetch(() => jsonResponse(200, SUCCESS));
    const outcome = await requestValidation("vercel", "next.js", {
      fetchImplementation: fetcher.fn,
      signal: controller.signal,
    });
    expect(outcome).toEqual({ status: "aborted" });
    expect(fetcher.calls).toHaveLength(0);
  });
});
