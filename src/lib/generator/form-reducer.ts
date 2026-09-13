import type {
  FormEvent,
  FormState,
  RequestResolution,
} from "@/lib/generator/types";

export const INITIAL_FORM_STATE: FormState = { status: "idle" };

function isCoolingDown(state: FormState, now: number): boolean {
  return (
    state.status === "error" &&
    state.cooldownUntil !== null &&
    state.cooldownUntil > now
  );
}

function resolve(
  state: FormState,
  sequence: number,
  resolution: RequestResolution,
  now: number,
): FormState {
  if (state.status !== "validating" || state.sequence !== sequence) {
    return state;
  }
  switch (resolution.status) {
    case "aborted":
      return state;
    case "ok":
      return {
        status: "success",
        owner: resolution.owner,
        repo: resolution.repo,
      };
    case "error":
      return {
        status: "error",
        kind: resolution.kind,
        cooldownUntil:
          resolution.kind === "too_many_requests" &&
          resolution.retryAfterSeconds !== undefined
            ? now + resolution.retryAfterSeconds * 1000
            : null,
      };
  }
}

export function formReducer(
  state: FormState,
  event: FormEvent,
  now: number,
): FormState {
  switch (event.type) {
    case "REJECT_INPUT":
      return { status: "error", kind: "invalid_url", cooldownUntil: null };
    case "SUBMIT":
      if (state.status === "validating" || isCoolingDown(state, now)) {
        return state;
      }
      return {
        status: "validating",
        sequence: event.sequence,
        previous:
          state.status === "success"
            ? { owner: state.owner, repo: state.repo }
            : null,
      };
    case "RESOLVE":
      return resolve(state, event.sequence, event.resolution, now);
    case "COOLDOWN_ENDED":
      return state.status === "error" && state.cooldownUntil !== null
        ? { ...state, cooldownUntil: null }
        : state;
    default:
      return state;
  }
}
