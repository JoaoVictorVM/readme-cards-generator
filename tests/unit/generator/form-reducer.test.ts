import { describe, expect, test } from "bun:test";
import {
  formReducer,
  INITIAL_FORM_STATE,
  type FormEvent,
  type FormState,
} from "@/lib/generator";

const NOW = 1735689600000;

const OK = { status: "ok", owner: "vercel", repo: "next.js" } as const;

const SUCCESS: FormState = {
  status: "success",
  owner: "vercel",
  repo: "next.js",
};
const VALIDATING: FormState = {
  status: "validating",
  sequence: 1,
  previous: null,
};
const NOT_FOUND: FormState = {
  status: "error",
  kind: "not_found",
  cooldownUntil: null,
};
const COOLING: FormState = {
  status: "error",
  kind: "too_many_requests",
  cooldownUntil: NOW + 30_000,
};

function reduce(state: FormState, event: FormEvent): FormState {
  return formReducer(state, event, NOW);
}

describe("formReducer", () => {
  test("initial state is idle", () => {
    expect(INITIAL_FORM_STATE).toEqual({ status: "idle" });
  });

  test("reject input from any state clears result", () => {
    for (const state of [INITIAL_FORM_STATE, SUCCESS, NOT_FOUND, VALIDATING]) {
      expect(reduce(state, { type: "REJECT_INPUT" })).toEqual({
        status: "error",
        kind: "invalid_url",
        cooldownUntil: null,
      });
    }
  });

  test("submit from idle enters validating", () => {
    expect(reduce(INITIAL_FORM_STATE, { type: "SUBMIT", sequence: 1 })).toEqual(
      { status: "validating", sequence: 1, previous: null },
    );
  });

  test("submit from success keeps previous pair", () => {
    expect(reduce(SUCCESS, { type: "SUBMIT", sequence: 2 })).toEqual({
      status: "validating",
      sequence: 2,
      previous: { owner: "vercel", repo: "next.js" },
    });
  });

  test("submit while validating is ignored", () => {
    const next = reduce(VALIDATING, { type: "SUBMIT", sequence: 2 });
    expect(next).toBe(VALIDATING);
  });

  test("submit during active cooldown is ignored", () => {
    expect(reduce(COOLING, { type: "SUBMIT", sequence: 2 })).toBe(COOLING);
  });

  test("submit after cooldown ended is accepted", () => {
    const ended: FormState = { ...COOLING, cooldownUntil: null };
    expect(reduce(ended, { type: "SUBMIT", sequence: 2 })).toEqual({
      status: "validating",
      sequence: 2,
      previous: null,
    });
    const elapsed: FormState = { ...COOLING, cooldownUntil: NOW - 1 };
    expect(reduce(elapsed, { type: "SUBMIT", sequence: 3 }).status).toBe(
      "validating",
    );
  });

  test("resolve ok with current sequence enters success", () => {
    expect(
      reduce(VALIDATING, { type: "RESOLVE", sequence: 1, resolution: OK }),
    ).toEqual(SUCCESS);
  });

  test("resolve with stale sequence is ignored", () => {
    const state: FormState = { ...VALIDATING, sequence: 2 };
    expect(
      reduce(state, { type: "RESOLVE", sequence: 1, resolution: OK }),
    ).toBe(state);
    expect(
      reduce(SUCCESS, { type: "RESOLVE", sequence: 1, resolution: OK }),
    ).toBe(SUCCESS);
  });

  test("resolve error clears previous result", () => {
    const state: FormState = {
      ...VALIDATING,
      previous: { owner: "vercel", repo: "next.js" },
    };
    expect(
      reduce(state, {
        type: "RESOLVE",
        sequence: 1,
        resolution: { status: "error", kind: "not_found" },
      }),
    ).toEqual(NOT_FOUND);
  });

  test("resolve too_many_requests sets cooldown", () => {
    expect(
      reduce(VALIDATING, {
        type: "RESOLVE",
        sequence: 1,
        resolution: {
          status: "error",
          kind: "too_many_requests",
          retryAfterSeconds: 37,
        },
      }),
    ).toEqual({
      status: "error",
      kind: "too_many_requests",
      cooldownUntil: NOW + 37_000,
    });
  });

  test("resolve quota_exhausted sets no cooldown", () => {
    expect(
      reduce(VALIDATING, {
        type: "RESOLVE",
        sequence: 1,
        resolution: { status: "error", kind: "quota_exhausted" },
      }),
    ).toEqual({
      status: "error",
      kind: "quota_exhausted",
      cooldownUntil: null,
    });
  });

  test("resolve aborted is ignored", () => {
    expect(
      reduce(VALIDATING, {
        type: "RESOLVE",
        sequence: 1,
        resolution: { status: "aborted" },
      }),
    ).toBe(VALIDATING);
  });

  test("cooldown ended clears cooldown keeps message", () => {
    expect(reduce(COOLING, { type: "COOLDOWN_ENDED" })).toEqual({
      status: "error",
      kind: "too_many_requests",
      cooldownUntil: null,
    });
  });

  test("cooldown ended elsewhere is noop", () => {
    for (const state of [INITIAL_FORM_STATE, SUCCESS, VALIDATING, NOT_FOUND]) {
      expect(reduce(state, { type: "COOLDOWN_ENDED" })).toBe(state);
    }
  });

  test("reducer never throws on unknown event", () => {
    const event = { type: "NOPE" } as unknown as FormEvent;
    expect(reduce(SUCCESS, event)).toBe(SUCCESS);
  });
});
