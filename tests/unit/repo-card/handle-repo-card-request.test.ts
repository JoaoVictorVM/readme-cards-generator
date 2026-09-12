import { afterEach, beforeEach, describe, expect, spyOn, test } from "bun:test";
import { renderCard, renderErrorCard } from "@/lib/card";
import type { RepositoryLookupOutcome } from "@/lib/github";
import type { LanguageVisual } from "@/lib/language-icon";
import {
  RATE_LIMIT_NAMESPACES,
  type RateLimitDecision,
  type RateLimitNamespace,
} from "@/lib/rate-limit";
import { handleRepoCardRequest } from "@/lib/repo-card";
import type {
  LanguageIconResolver,
  RateLimitCheck,
  RepoCardDependencies,
  RepoCardOptions,
  RepoCardParams,
  RepositoryLookup,
} from "@/lib/repo-card/types";
import {
  backgroundRect,
  expectStandaloneSvg,
  expectZeroExternalReferences,
  NOW,
  REPOSITORY,
  rootElement,
  textContent,
  visualFor,
} from "../card/helpers";

const SVG_TYPE = "image/svg+xml; charset=utf-8";
const SUCCESS = "public, s-maxage=3600, stale-while-revalidate=86400";
const ERROR = "public, s-maxage=60";
const DEFAULTS: RepoCardOptions = { theme: "dark", locale: "en", width: 380 };
const PARAMS: RepoCardParams = { owner: "vercel", repo: "next.js" };
const ID_PREFIX = "bgi-test";

const ALLOWED: RateLimitDecision = {
  allowed: true,
  limit: 60,
  remaining: 59,
  resetAt: NOW + 60_000,
  retryAfterSeconds: 1,
  identifier: "203.0.113.7",
  degraded: null,
};

const REJECTED: RateLimitDecision = {
  allowed: false,
  limit: 60,
  remaining: 0,
  resetAt: NOW + 37_000,
  retryAfterSeconds: 37,
  identifier: "203.0.113.7",
  degraded: null,
};

function request(query = ""): Request {
  return new Request(`http://localhost/api/repo/vercel/next.js${query}`, {
    headers: { "x-forwarded-for": "203.0.113.7" },
  });
}

type LookupCall = { owner: string; repo: string };

function fakeLookup(outcome: RepositoryLookupOutcome): {
  calls: LookupCall[];
  lookup: RepositoryLookup;
} {
  const calls: LookupCall[] = [];
  const lookup: RepositoryLookup = async (owner, repo) => {
    calls.push({ owner, repo });
    return outcome;
  };
  return { calls, lookup };
}

type LimitCall = { headers: Headers; namespace: RateLimitNamespace };

function fakeLimiter(decision: RateLimitDecision): {
  calls: LimitCall[];
  check: RateLimitCheck;
} {
  const calls: LimitCall[] = [];
  const check: RateLimitCheck = async (input, namespace) => {
    const headers = input instanceof Headers ? input : input.headers;
    calls.push({ headers, namespace });
    return decision;
  };
  return { calls, check };
}

function fakeResolver(): {
  calls: Array<string | null>;
  resolve: LanguageIconResolver;
} {
  const calls: Array<string | null> = [];
  const resolve: LanguageIconResolver = async (language) => {
    calls.push(language);
    return visualFor(language, ID_PREFIX);
  };
  return { calls, resolve };
}

type Harness = RepoCardDependencies & {
  lookupCalls: LookupCall[];
  limitCalls: LimitCall[];
  resolverCalls: Array<string | null>;
};

function deps(
  outcome: RepositoryLookupOutcome = { status: "ok", data: REPOSITORY },
  decision: RateLimitDecision = ALLOWED,
): Harness {
  const lookup = fakeLookup(outcome);
  const limiter = fakeLimiter(decision);
  const resolver = fakeResolver();
  return {
    fetchRepository: lookup.lookup,
    checkRateLimit: limiter.check,
    resolveLanguageIcon: resolver.resolve,
    now: () => NOW,
    lookupCalls: lookup.calls,
    limitCalls: limiter.calls,
    resolverCalls: resolver.calls,
  };
}

async function expectedCard(
  visual: LanguageVisual,
  options: Partial<RepoCardOptions> = {},
  now = NOW,
): Promise<string> {
  return renderCard({
    repository: REPOSITORY,
    visual,
    ...DEFAULTS,
    ...options,
    now,
  });
}

function expectSvgHeaders(response: Response): void {
  expect(response.headers.get("content-type")).toBe(SVG_TYPE);
  expect(response.headers.get("x-content-type-options")).toBe("nosniff");
}

function title(markup: string): string {
  return /<title>([^<]*)<\/title>/.exec(markup)![1]!;
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

describe("handleRepoCardRequest", () => {
  test("existing repository returns 200 data card", async () => {
    const d = deps();
    const response = await handleRepoCardRequest(request(), PARAMS, d);
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe(SUCCESS);
    expectSvgHeaders(response);
    const visual = await visualFor("JavaScript", ID_PREFIX);
    expect(await response.text()).toBe(await expectedCard(visual));
    expect(d.lookupCalls).toEqual([PARAMS]);
    expect(d.resolverCalls).toEqual(["JavaScript"]);
  });

  test("data card uses request options", async () => {
    const response = await handleRepoCardRequest(
      request("?theme=light&locale=pt-BR&width=480"),
      PARAMS,
      deps(),
    );
    const body = await response.text();
    const visual = await visualFor("JavaScript", ID_PREFIX);
    expect(body).toBe(
      await expectedCard(visual, {
        theme: "light",
        locale: "pt-BR",
        width: 480,
      }),
    );
    expectStandaloneSvg(body, 480);
  });

  test("invalid parameters fall back to defaults", async () => {
    const plain = await handleRepoCardRequest(request(), PARAMS, deps());
    const odd = await handleRepoCardRequest(
      request("?theme=purple&locale=fr&width=abc"),
      PARAMS,
      deps(),
    );
    expect(odd.status).toBe(200);
    expect(await odd.text()).toBe(await plain.text());
  });

  test("width clamps through the endpoint", async () => {
    const low = await handleRepoCardRequest(
      request("?width=100"),
      PARAMS,
      deps(),
    );
    expectStandaloneSvg(await low.text(), 280);
    const high = await handleRepoCardRequest(
      request("?width=9999"),
      PARAMS,
      deps(),
    );
    expectStandaloneSvg(await high.text(), 600);
  });

  test("null language renders fallback visual", async () => {
    const d = deps({
      status: "ok",
      data: { ...REPOSITORY, language: null },
    });
    const response = await handleRepoCardRequest(request(), PARAMS, d);
    expect(response.status).toBe(200);
    expect(await response.text()).toContain('fill="#2b2f3a"');
    expect(d.resolverCalls).toEqual([null]);
  });

  test("nonexistent repository returns 404 card", async () => {
    const d = deps({ status: "not_found" });
    const response = await handleRepoCardRequest(request(), PARAMS, d);
    expect(response.status).toBe(404);
    expect(response.headers.get("cache-control")).toBe(ERROR);
    expect(await response.text()).toBe(
      renderErrorCard({ kind: "not_found", ...DEFAULTS }),
    );
    expect(d.lookupCalls).toHaveLength(1);
    expect(d.resolverCalls).toHaveLength(0);
  });

  test("error card follows locale query", async () => {
    const response = await handleRepoCardRequest(
      request("?locale=pt-BR"),
      PARAMS,
      deps({ status: "not_found" }),
    );
    expect(title(await response.text())).toBe("Repositório não encontrado");
  });

  test("invalid segment returns 400 without lookup", async () => {
    const d = deps();
    const cases: RepoCardParams[] = [
      { owner: "a/b", repo: "c" },
      { owner: "a", repo: "r".repeat(101) },
      { owner: undefined as unknown as string, repo: "c" },
      { owner: "..", repo: "c" },
    ];
    for (const params of cases) {
      const response = await handleRepoCardRequest(request(), params, d);
      expect(response.status).toBe(400);
      expect(response.headers.get("cache-control")).toBe(ERROR);
      expect(await response.text()).toBe(
        renderErrorCard({ kind: "invalid_request", ...DEFAULTS }),
      );
    }
    expect(d.lookupCalls).toHaveLength(0);
    expect(d.resolverCalls).toHaveLength(0);
  });

  test("github quota returns 403 distinct from 429", async () => {
    const d = deps({
      status: "rate_limited",
      resetAt: NOW + 47_000,
      retryAfterSeconds: 47,
    });
    const response = await handleRepoCardRequest(request(), PARAMS, d);
    expect(response.status).toBe(403);
    expect(response.headers.get("retry-after")).toBe("47");
    expect(response.headers.get("x-ratelimit-limit")).toBeNull();
    expect(response.headers.get("cache-control")).toBe(ERROR);
    const body = await response.text();
    expect(body).toBe(renderErrorCard({ kind: "rate_limited", ...DEFAULTS }));
    expect(body).toContain("<desc>Configure GITHUB_TOKEN");
  });

  test("github quota without hint has no retry-after", async () => {
    const response = await handleRepoCardRequest(
      request(),
      PARAMS,
      deps({ status: "rate_limited", resetAt: null, retryAfterSeconds: null }),
    );
    expect(response.status).toBe(403);
    expect(response.headers.get("retry-after")).toBeNull();
  });

  test("upstream error returns 502 card", async () => {
    const response = await handleRepoCardRequest(
      request(),
      PARAMS,
      deps({ status: "upstream_error", reason: "timeout", httpStatus: null }),
    );
    expect(response.status).toBe(502);
    expect(await response.text()).toBe(
      renderErrorCard({ kind: "upstream_error", ...DEFAULTS }),
    );
  });

  test("unexpected error returns 500 card", async () => {
    const response = await handleRepoCardRequest(
      request(),
      PARAMS,
      deps({ status: "unexpected_error", reason: "missing_fields" }),
    );
    expect(response.status).toBe(500);
    expect(response.headers.get("cache-control")).toBe(ERROR);
    expect(await response.text()).toBe(
      renderErrorCard({ kind: "unexpected_error", ...DEFAULTS }),
    );
  });

  test("rate limit rejection returns 429 before parsing", async () => {
    const d = deps({ status: "ok", data: REPOSITORY }, REJECTED);
    const response = await handleRepoCardRequest(
      request(),
      { owner: "a/b", repo: "c" },
      d,
    );
    expect(response.status).toBe(429);
    expect(await response.text()).toBe(
      renderErrorCard({ kind: "too_many_requests", ...DEFAULTS }),
    );
    expect(response.headers.get("retry-after")).toBe("37");
    expect(response.headers.get("x-ratelimit-limit")).toBe("60");
    expect(response.headers.get("x-ratelimit-remaining")).toBe("0");
    expect(response.headers.get("x-ratelimit-reset")).toBe(
      String(NOW + 37_000),
    );
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(d.lookupCalls).toHaveLength(0);
    expect(d.resolverCalls).toHaveLength(0);
  });

  test("rate limit card is localized", async () => {
    const response = await handleRepoCardRequest(
      request("?locale=pt-BR&width=280"),
      PARAMS,
      deps({ status: "ok", data: REPOSITORY }, REJECTED),
    );
    const body = await response.text();
    expect(title(body)).toBe("Muitas requisições, tente de novo em um minuto");
    expectStandaloneSvg(body, 280);
  });

  test("limiter called with card namespace", async () => {
    const d = deps();
    await handleRepoCardRequest(request(), PARAMS, d);
    expect(d.limitCalls).toHaveLength(1);
    expect(d.limitCalls[0]?.namespace).toBe(RATE_LIMIT_NAMESPACES.card);
    expect(d.limitCalls[0]?.headers.get("x-forwarded-for")).toBe("203.0.113.7");
  });

  test("degraded decision is treated as allow", async () => {
    const response = await handleRepoCardRequest(
      request(),
      PARAMS,
      deps({ status: "not_found" }, { ...ALLOWED, degraded: "not_configured" }),
    );
    expect(response.status).toBe(404);
    for (const [name] of response.headers) {
      expect(name.toLowerCase()).not.toContain("degrad");
    }
    expect(response.headers.get("x-ratelimit-limit")).toBeNull();
  });

  async function everyBranch(width = 380): Promise<Response[]> {
    const query = width === 380 ? "" : `?width=${width}`;
    const cases: Array<[RepoCardParams, Harness]> = [
      [PARAMS, deps()],
      [{ owner: "a/b", repo: "c" }, deps()],
      [
        PARAMS,
        deps({ status: "rate_limited", resetAt: null, retryAfterSeconds: 3 }),
      ],
      [PARAMS, deps({ status: "not_found" })],
      [PARAMS, deps({ status: "ok", data: REPOSITORY }, REJECTED)],
      [PARAMS, deps({ status: "unexpected_error", reason: "thrown" })],
      [
        PARAMS,
        deps({ status: "upstream_error", reason: "network", httpStatus: null }),
      ],
    ];
    const responses: Response[] = [];
    for (const [params, d] of cases) {
      responses.push(await handleRepoCardRequest(request(query), params, d));
    }
    return responses;
  }

  test("every response carries svg headers", async () => {
    const responses = await everyBranch();
    expect(responses.map((r) => r.status).sort()).toEqual([
      200, 400, 403, 404, 429, 500, 502,
    ]);
    for (const response of responses) {
      expectSvgHeaders(response);
      const body = await response.text();
      expectStandaloneSvg(body, 380);
      expectZeroExternalReferences(body);
    }
  });

  test("every status shares the frame", async () => {
    const bodies = await Promise.all(
      (await everyBranch(480)).map((r) => r.text()),
    );
    const roots = new Set(bodies.map(rootElement));
    const backgrounds = new Set(bodies.map(backgroundRect));
    expect(roots.size).toBe(1);
    expect(backgrounds.size).toBe(1);
    expectStandaloneSvg(bodies[0]!, 480);
  });

  test("thrown lookup yields 500 card with request options", async () => {
    const d = deps();
    d.fetchRepository = () => {
      throw new Error("boom http://localhost/api/repo/vercel/next.js?x=1");
    };
    const response = await handleRepoCardRequest(
      request("?locale=pt-BR&theme=light"),
      PARAMS,
      d,
    );
    expect(response.status).toBe(500);
    expectSvgHeaders(response);
    expect(response.headers.get("cache-control")).toBe(ERROR);
    expect(await response.text()).toBe(
      renderErrorCard({
        kind: "unexpected_error",
        theme: "light",
        locale: "pt-BR",
        width: 380,
      }),
    );
    expect(errorSpy).toHaveBeenCalledTimes(1);
    const line = String(errorSpy.mock.calls[0]?.[0]);
    expect(line).toContain("route=/api/repo/[owner]/[repo]");
    expect(line).toContain("error=Error");
    expect(line).not.toContain("localhost");
  });

  test("thrown limiter yields 500 card", async () => {
    const d = deps();
    d.checkRateLimit = async () => {
      throw new TypeError("redis exploded");
    };
    const response = await handleRepoCardRequest(request(), PARAMS, d);
    expect(response.status).toBe(500);
    expectSvgHeaders(response);
    expect(await response.text()).toBe(
      renderErrorCard({ kind: "unexpected_error", ...DEFAULTS }),
    );
    expect(errorSpy).toHaveBeenCalledTimes(1);
    expect(d.lookupCalls).toHaveLength(0);
  });

  test("thrown resolver yields 500 card", async () => {
    const d = deps();
    d.resolveLanguageIcon = async () => {
      throw new Error("contract violation");
    };
    const response = await handleRepoCardRequest(request(), PARAMS, d);
    expect(response.status).toBe(500);
    expect(await response.text()).toBe(
      renderErrorCard({ kind: "unexpected_error", ...DEFAULTS }),
    );
  });

  test("handler does not memoize", async () => {
    const d = deps();
    await handleRepoCardRequest(request(), PARAMS, d);
    await handleRepoCardRequest(request(), PARAMS, d);
    expect(d.lookupCalls).toHaveLength(2);
    expect(d.resolverCalls).toHaveLength(2);
  });

  test("now seam drives activity line", async () => {
    const first = deps();
    const later = deps();
    later.now = () => NOW + 365 * 24 * 60 * 60 * 1000;
    const a = await (
      await handleRepoCardRequest(request(), PARAMS, first)
    ).text();
    const b = await (
      await handleRepoCardRequest(request(), PARAMS, later)
    ).text();
    expect(textContent(a, 108, 66)).not.toBe("");
    expect(textContent(a, 108, 66)).not.toBe(textContent(b, 108, 66));
  });

  test("production call omits dependencies", async () => {
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    const response = await handleRepoCardRequest(request(), {
      owner: "o".repeat(101),
      repo: "x",
    });
    expect(response.status).toBe(400);
    expectSvgHeaders(response);
    expect(await response.text()).toBe(
      renderErrorCard({ kind: "invalid_request", ...DEFAULTS }),
    );
  });
});
