import { describe, expect, test } from "bun:test";
import { resolveClientIdentifier } from "@/lib/rate-limit/client-ip";
import {
  RATE_LIMIT_ANONYMOUS_IDENTIFIER,
  RATE_LIMIT_IDENTIFIER_MAX_LENGTH,
} from "@/lib/rate-limit/config";

function headers(forwarded?: string): Headers {
  const value = new Headers();
  if (forwarded !== undefined) value.set("x-forwarded-for", forwarded);
  return value;
}

describe("resolveClientIdentifier", () => {
  test("single ip is returned", () => {
    expect(resolveClientIdentifier(headers("203.0.113.7"))).toBe("203.0.113.7");
  });

  test("first entry of chain is used", () => {
    expect(
      resolveClientIdentifier(headers(" 203.0.113.7 , 10.0.0.1, 10.0.0.2")),
    ).toBe("203.0.113.7");
  });

  test("missing header falls back to anonymous", () => {
    expect(resolveClientIdentifier(headers())).toBe(
      RATE_LIMIT_ANONYMOUS_IDENTIFIER,
    );
  });

  test("blank header falls back to anonymous", () => {
    expect(resolveClientIdentifier(headers(""))).toBe(
      RATE_LIMIT_ANONYMOUS_IDENTIFIER,
    );
    expect(resolveClientIdentifier(headers("   "))).toBe(
      RATE_LIMIT_ANONYMOUS_IDENTIFIER,
    );
    expect(resolveClientIdentifier(headers(" , 10.0.0.1"))).toBe(
      RATE_LIMIT_ANONYMOUS_IDENTIFIER,
    );
  });

  test("identifier is length capped", () => {
    const forged = "x".repeat(500);
    const identifier = resolveClientIdentifier(headers(forged));
    expect(identifier.length).toBe(RATE_LIMIT_IDENTIFIER_MAX_LENGTH);
  });

  test("ipv6 address is preserved", () => {
    const address = "2001:db8:85a3::8a2e:370:7334";
    expect(resolveClientIdentifier(headers(address))).toBe(address);
  });

  test("identifier is normalized case", () => {
    const lower = resolveClientIdentifier(headers("2001:db8::8a2e:370:7334"));
    const upper = resolveClientIdentifier(headers("2001:DB8::8A2E:370:7334"));
    expect(upper).toBe(lower);
  });
});
