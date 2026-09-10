import { describe, expect, test } from "bun:test";
import {
  DEVICON_MAX_RESPONSE_BYTES,
  DEVICON_RELEASE,
  DEVICON_REQUEST_TIMEOUT_MS,
} from "@/lib/language-icon/config";
import { fetchIconMarkup } from "@/lib/language-icon/devicon-client";
import type { FetchImplementation } from "@/lib/language-icon/types";

const ICON = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"/>';

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

describe("fetchIconMarkup", () => {
  test("url is built from the pinned release and variant", async () => {
    const { calls, fetchImpl } = recorder(() => new Response(ICON));
    await fetchIconMarkup("objectivec", "plain", fetchImpl);
    expect(calls[0]!.url).toBe(
      `https://cdn.jsdelivr.net/gh/devicons/devicon@${DEVICON_RELEASE}/icons/objectivec/objectivec-plain.svg`,
    );
  });

  test("successful response returns the markup unchanged", async () => {
    const { fetchImpl } = recorder(() => new Response(ICON));
    expect(await fetchIconMarkup("go", "original", fetchImpl)).toEqual({
      ok: true,
      markup: ICON,
    });
  });

  test("non-200 returns http_error", async () => {
    for (const status of [404, 500]) {
      const { fetchImpl } = recorder(() => new Response("", { status }));
      expect(await fetchIconMarkup("go", "original", fetchImpl)).toEqual({
        ok: false,
        cause: "http_error",
      });
    }
  });

  test("html body returns not_svg", async () => {
    const { fetchImpl } = recorder(
      () => new Response("<!DOCTYPE html><html><body>404</body></html>"),
    );
    expect(await fetchIconMarkup("go", "original", fetchImpl)).toEqual({
      ok: false,
      cause: "not_svg",
    });
  });

  test("oversized body returns too_large", async () => {
    const oversized = "x".repeat(DEVICON_MAX_RESPONSE_BYTES + 1);
    const { fetchImpl } = recorder(() => new Response(oversized));
    expect(await fetchIconMarkup("go", "original", fetchImpl)).toEqual({
      ok: false,
      cause: "too_large",
    });
  });

  test("oversized content-length is rejected before the body is read", async () => {
    let read = false;
    const fetchImpl: FetchImplementation = async () =>
      ({
        status: 200,
        headers: new Headers({
          "content-length": String(DEVICON_MAX_RESPONSE_BYTES + 1),
        }),
        text: async () => {
          read = true;
          return ICON;
        },
      }) as unknown as Response;
    expect(await fetchIconMarkup("go", "original", fetchImpl)).toEqual({
      ok: false,
      cause: "too_large",
    });
    expect(read).toBe(false);
  });

  test("a stalled response returns timeout inside the budget", async () => {
    const fetchImpl: FetchImplementation = (_url, init) =>
      new Promise((_resolve, reject) => {
        init.signal?.addEventListener("abort", () =>
          reject(new DOMException("aborted", "AbortError")),
        );
      });
    const started = Date.now();
    const result = await fetchIconMarkup("go", "original", fetchImpl);
    const elapsed = Date.now() - started;
    expect(result).toEqual({ ok: false, cause: "timeout" });
    expect(elapsed).toBeGreaterThanOrEqual(DEVICON_REQUEST_TIMEOUT_MS - 50);
    expect(elapsed).toBeLessThan(DEVICON_REQUEST_TIMEOUT_MS + 1000);
  });

  test("an abort signal is passed to fetch", async () => {
    const { calls, fetchImpl } = recorder(() => new Response(ICON));
    await fetchIconMarkup("go", "original", fetchImpl);
    expect(calls[0]!.init.signal).toBeInstanceOf(AbortSignal);
    expect(calls[0]!.init.headers).toMatchObject({ Accept: "image/svg+xml" });
  });

  test("a thrown fetch returns transport_error", async () => {
    const fetchImpl: FetchImplementation = async () => {
      throw new TypeError("dns failure");
    };
    expect(await fetchIconMarkup("go", "original", fetchImpl)).toEqual({
      ok: false,
      cause: "transport_error",
    });
  });

  test("the client never throws", async () => {
    const throwers: FetchImplementation[] = [
      () => {
        throw new Error("sync");
      },
      async () => {
        throw new Error("async");
      },
      async () => ({}) as unknown as Response,
    ];
    for (const fetchImpl of throwers) {
      const result = await fetchIconMarkup("go", "original", fetchImpl);
      expect(result.ok).toBe(false);
    }
  });

  test("markup behind a prolog and comments is still accepted", async () => {
    const body = `<?xml version="1.0"?>\n<!-- note -->\n${ICON}`;
    const { fetchImpl } = recorder(() => new Response(body));
    expect(await fetchIconMarkup("go", "original", fetchImpl)).toEqual({
      ok: true,
      markup: body,
    });
  });
});
