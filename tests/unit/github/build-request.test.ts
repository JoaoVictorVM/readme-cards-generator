import { afterEach, describe, expect, test } from "bun:test";
import { buildRepositoryRequest } from "@/lib/github/build-request";
import {
  GITHUB_ACCEPT_HEADER,
  GITHUB_API_VERSION,
  GITHUB_USER_AGENT,
} from "@/lib/github/config";

const ref = { owner: "vercel", repo: "next.js" };

afterEach(() => {
  delete process.env.GITHUB_TOKEN;
});

describe("buildRepositoryRequest", () => {
  test("url targets the repos endpoint with encoded segments", () => {
    expect(buildRepositoryRequest(ref).url).toBe(
      "https://api.github.com/repos/vercel/next.js",
    );
    expect(buildRepositoryRequest({ owner: "a.b", repo: "c-d_e" }).url).toBe(
      "https://api.github.com/repos/a.b/c-d_e",
    );
  });

  test("sends accept and api version headers", () => {
    const { headers } = buildRepositoryRequest(ref);
    expect(headers.Accept).toBe(GITHUB_ACCEPT_HEADER);
    expect(headers["X-GitHub-Api-Version"]).toBe(GITHUB_API_VERSION);
  });

  test("sends fixed user agent", () => {
    const { headers } = buildRepositoryRequest({ owner: "x", repo: "y" });
    expect(headers["User-Agent"]).toBe(GITHUB_USER_AGENT);
    expect(headers["User-Agent"]).toStartWith("badge-generate/1.0 (+");
  });

  test("sends authorization when token present", () => {
    const { headers } = buildRepositoryRequest(ref, "ghp_example");
    expect(headers.Authorization).toBe("Bearer ghp_example");
  });

  test("omits authorization when token absent", () => {
    delete process.env.GITHUB_TOKEN;
    expect(buildRepositoryRequest(ref).headers.Authorization).toBeUndefined();
    expect(
      buildRepositoryRequest(ref, undefined).headers.Authorization,
    ).toBeUndefined();
  });

  test("omits authorization when token blank", () => {
    expect(
      buildRepositoryRequest(ref, "   ").headers.Authorization,
    ).toBeUndefined();
    process.env.GITHUB_TOKEN = "   ";
    expect(buildRepositoryRequest(ref).headers.Authorization).toBeUndefined();
  });

  test("reads the token from the environment accessor by default", () => {
    process.env.GITHUB_TOKEN = "ghp_from_env";
    expect(buildRepositoryRequest(ref).headers.Authorization).toBe(
      "Bearer ghp_from_env",
    );
  });
});
