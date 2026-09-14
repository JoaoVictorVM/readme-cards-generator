import { afterEach, describe, expect, test } from "bun:test";
import { getCanonicalHost } from "@/lib/site-config";

const names = [
  "VERCEL_PROJECT_PRODUCTION_URL",
  "NEXT_PUBLIC_VERCEL_URL",
  "VERCEL_URL",
] as const;

function clear() {
  for (const name of names) delete process.env[name];
}

afterEach(clear);

describe("getCanonicalHost", () => {
  test("falls back to localhost when no Vercel var is set", () => {
    clear();
    expect(getCanonicalHost()).toBe("http://localhost:3000");
  });

  test("prefers the production domain over the deployment URL", () => {
    clear();
    process.env.VERCEL_PROJECT_PRODUCTION_URL = "cards.vercel.app";
    process.env.NEXT_PUBLIC_VERCEL_URL = "cards-abc123.vercel.app";
    process.env.VERCEL_URL = "cards-abc123.vercel.app";
    expect(getCanonicalHost()).toBe("https://cards.vercel.app");
  });

  test("uses NEXT_PUBLIC_VERCEL_URL before VERCEL_URL", () => {
    clear();
    process.env.NEXT_PUBLIC_VERCEL_URL = "public.vercel.app";
    process.env.VERCEL_URL = "deploy.vercel.app";
    expect(getCanonicalHost()).toBe("https://public.vercel.app");
  });

  test("uses VERCEL_URL when nothing else is set", () => {
    clear();
    process.env.VERCEL_URL = "deploy.vercel.app";
    expect(getCanonicalHost()).toBe("https://deploy.vercel.app");
  });

  test("treats a whitespace-only value as absent and trims the host", () => {
    clear();
    process.env.VERCEL_PROJECT_PRODUCTION_URL = "   ";
    process.env.VERCEL_URL = "  deploy.vercel.app  ";
    expect(getCanonicalHost()).toBe("https://deploy.vercel.app");
  });
});
