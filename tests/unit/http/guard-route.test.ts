import { afterEach, beforeEach, describe, expect, spyOn, test } from "bun:test";
import { guardRoute } from "@/lib/http/guard-route";

const ROUTE = "/api/test";

function request(): Request {
  return new Request("http://localhost/api/test?secret=1");
}

function fallback(error: unknown): Response {
  return new Response(
    JSON.stringify({ fallback: true, error: String(error) }),
    {
      status: 500,
      headers: { "content-type": "application/json" },
    },
  );
}

let errorSpy: ReturnType<typeof spyOn>;

beforeEach(() => {
  errorSpy = spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  errorSpy.mockRestore();
});

describe("guardRoute", () => {
  test("passes through successful response", async () => {
    const inner = new Response("ok", { status: 200 });
    const handler = guardRoute(ROUTE, async () => inner, fallback);
    const response = await handler(request());
    expect(response).toBe(inner);
    expect(errorSpy).not.toHaveBeenCalled();
  });

  test("thrown error produces fallback response", async () => {
    const thrown = new TypeError("boom");
    let received: unknown;
    const handler = guardRoute(
      ROUTE,
      async () => {
        throw thrown;
      },
      (error) => {
        received = error;
        return fallback(error);
      },
    );
    const response = await handler(request());
    expect(received).toBe(thrown);
    expect(response.status).toBe(500);
    expect(await response.json()).toMatchObject({ fallback: true });
  });

  test("rejected non-error produces fallback response", async () => {
    const handler = guardRoute(
      ROUTE,
      () => Promise.reject("plain string"),
      fallback,
    );
    const response = await handler(request());
    expect(response.status).toBe(500);
    expect(await response.json()).toMatchObject({
      fallback: true,
      error: "plain string",
    });
  });

  test("synchronous throw is caught", async () => {
    const handler = guardRoute(
      ROUTE,
      () => {
        throw new Error("sync");
      },
      fallback,
    );
    const response = await handler(request());
    expect(response.status).toBe(500);
    expect(await response.json()).toMatchObject({ fallback: true });
  });

  test("logs route label and error name only", async () => {
    const handler = guardRoute(
      ROUTE,
      async () => {
        throw new RangeError("failed at http://evil.example/?token=abc");
      },
      fallback,
    );
    await handler(request());
    expect(errorSpy).toHaveBeenCalledTimes(1);
    const line = String(errorSpy.mock.calls[0]?.[0]);
    expect(line).toContain(`route=${ROUTE}`);
    expect(line).toContain("error=RangeError");
    expect(line).not.toContain("evil.example");
    expect(line).not.toContain("token=abc");
    expect(line).not.toContain("secret=1");
  });

  test("fallback throwing yields bare 500", async () => {
    const handler = guardRoute(
      ROUTE,
      async () => {
        throw new Error("first");
      },
      () => {
        throw new Error("second");
      },
    );
    const response = await handler(request());
    expect(response.status).toBe(500);
    expect(await response.text()).toBe("");
    expect(errorSpy).toHaveBeenCalledTimes(2);
  });

  test("forwards extra arguments to the inner handler", async () => {
    let seen: unknown[] = [];
    const handler = guardRoute<[string, number]>(
      ROUTE,
      async (_request, a, b) => {
        seen = [a, b];
        return new Response(null, { status: 204 });
      },
      fallback,
    );
    const response = await handler(request(), "x", 2);
    expect(response.status).toBe(204);
    expect(seen).toEqual(["x", 2]);
  });
});
