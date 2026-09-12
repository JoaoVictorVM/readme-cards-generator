import { describe, expect, test } from "bun:test";
import { renderErrorCard } from "@/lib/card";
import type { RateLimitDecision } from "@/lib/rate-limit";
import {
  buildInvalidRequestResponse,
  buildRateLimitedResponse,
  buildSvgResponse,
  buildUnexpectedErrorResponse,
} from "@/lib/repo-card/build-response";
import type { RepoCardOptions, RepoCardStatus } from "@/lib/repo-card/types";

const SVG_TYPE = "image/svg+xml; charset=utf-8";
const SUCCESS = "public, s-maxage=3600, stale-while-revalidate=86400";
const ERROR = "public, s-maxage=60";
const STATUSES: RepoCardStatus[] = [200, 400, 403, 404, 429, 500, 502];
const ERROR_STATUSES: RepoCardStatus[] = [400, 403, 404, 500, 502];

const DEFAULTS: RepoCardOptions = { theme: "dark", locale: "en", width: 380 };
const PT_LIGHT: RepoCardOptions = {
  theme: "light",
  locale: "pt-BR",
  width: 480,
};

const REJECTED: RateLimitDecision = {
  allowed: false,
  limit: 60,
  remaining: 0,
  resetAt: 1735689637000,
  retryAfterSeconds: 37,
  identifier: "203.0.113.7",
  degraded: null,
};

const MARKUP = '<svg xmlns="http://www.w3.org/2000/svg"><title>x</title></svg>';

describe("buildSvgResponse", () => {
  test("body is the markup unmodified", async () => {
    const odd = "  <svg>\n\t<g/>  </svg>\r\n";
    expect(await buildSvgResponse(200, odd).text()).toBe(odd);
  });

  test("sets svg content type", () => {
    for (const status of STATUSES) {
      expect(buildSvgResponse(status, MARKUP).headers.get("content-type")).toBe(
        SVG_TYPE,
      );
    }
  });

  test("sets nosniff", () => {
    for (const status of STATUSES) {
      expect(
        buildSvgResponse(status, MARKUP).headers.get("x-content-type-options"),
      ).toBe("nosniff");
    }
  });

  test("success cache control", () => {
    expect(buildSvgResponse(200, MARKUP).headers.get("cache-control")).toBe(
      SUCCESS,
    );
  });

  test("error cache control", () => {
    for (const status of ERROR_STATUSES) {
      expect(
        buildSvgResponse(status, MARKUP).headers.get("cache-control"),
      ).toBe(ERROR);
    }
  });

  test("rate limited cache control is no-store", () => {
    expect(buildSvgResponse(429, MARKUP).headers.get("cache-control")).toBe(
      "no-store",
    );
  });

  test("extra headers merge without overriding mandatory ones", () => {
    const response = buildSvgResponse(403, MARKUP, {
      "Retry-After": "47",
      "Cache-Control": "no-store",
      "Content-Type": "text/plain",
      "X-Content-Type-Options": "none",
    });
    expect(response.headers.get("retry-after")).toBe("47");
    expect(response.headers.get("cache-control")).toBe(ERROR);
    expect(response.headers.get("content-type")).toBe(SVG_TYPE);
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
  });

  test("no vary header", () => {
    for (const status of STATUSES) {
      expect(buildSvgResponse(status, MARKUP).headers.has("vary")).toBe(false);
    }
  });
});

describe("dedicated builders", () => {
  test("invalid request builder", async () => {
    const response = buildInvalidRequestResponse(PT_LIGHT);
    expect(response.status).toBe(400);
    expect(response.headers.get("cache-control")).toBe(ERROR);
    expect(await response.text()).toBe(
      renderErrorCard({ kind: "invalid_request", ...PT_LIGHT }),
    );
  });

  test("rate limited builder includes f06 headers and card", async () => {
    const response = buildRateLimitedResponse(REJECTED, DEFAULTS);
    expect(response.status).toBe(429);
    expect(response.headers.get("retry-after")).toBe("37");
    expect(response.headers.get("x-ratelimit-limit")).toBe("60");
    expect(response.headers.get("x-ratelimit-remaining")).toBe("0");
    expect(response.headers.get("x-ratelimit-reset")).toBe("1735689637000");
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.text()).toBe(
      renderErrorCard({ kind: "too_many_requests", ...DEFAULTS }),
    );
  });

  test("fallback builder is 500 unexpected error card", async () => {
    const options: RepoCardOptions = { ...DEFAULTS, locale: "pt-BR" };
    const response = buildUnexpectedErrorResponse(options);
    expect(response.status).toBe(500);
    expect(response.headers.get("content-type")).toBe(SVG_TYPE);
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    expect(response.headers.get("cache-control")).toBe(ERROR);
    const body = await response.text();
    expect(body).toBe(
      renderErrorCard({ kind: "unexpected_error", ...options }),
    );
    expect(body).toContain("<title>Erro inesperado ao gerar o card</title>");
  });
});
