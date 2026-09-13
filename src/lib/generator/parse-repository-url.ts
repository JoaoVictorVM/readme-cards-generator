import { fail, ok, type Result } from "@/lib/result";
// Leaf import: the `@/lib/github` barrel drags the fetcher, logger and env
// accessors into the client bundle (see config.ts).
import { parseRepositoryRef } from "@/lib/github/parse-repository-ref";
import {
  GENERATOR_ACCEPTED_HOST,
  GENERATOR_GIT_SUFFIX,
  GENERATOR_WWW_PREFIX,
} from "@/lib/generator/config";
import type {
  RepositoryPair,
  RepositoryUrlFailure,
} from "@/lib/generator/types";

const SCHEME_PATTERN = /^https?:\/\//i;

const DOT_ONLY_PATTERN = /^\.+$/;

// A segment made only of dots (`..`) must reach the shared guard so it fails
// as an invalid owner rather than being mistaken for a host.
function looksLikeHost(segment: string): boolean {
  return segment.includes(".") && !DOT_ONLY_PATTERN.test(segment);
}

function stripScheme(input: string): { rest: string; hadScheme: boolean } {
  const match = SCHEME_PATTERN.exec(input);
  if (!match) return { rest: input, hadScheme: false };
  return { rest: input.slice(match[0].length), hadScheme: true };
}

function stripQueryAndFragment(input: string): string {
  const cut = input.search(/[?#]/);
  return cut === -1 ? input : input.slice(0, cut);
}

function normalizeHost(segment: string): string {
  const lower = segment.toLowerCase();
  return lower.startsWith(GENERATOR_WWW_PREFIX)
    ? lower.slice(GENERATOR_WWW_PREFIX.length)
    : lower;
}

function stripGitSuffix(segment: string): string {
  return segment.endsWith(GENERATOR_GIT_SUFFIX)
    ? segment.slice(0, -GENERATOR_GIT_SUFFIX.length)
    : segment;
}

export function parseRepositoryUrl(
  input: string,
): Result<RepositoryPair, RepositoryUrlFailure> {
  const trimmed = typeof input === "string" ? input.trim() : "";
  if (trimmed.length === 0) return fail("empty");

  const { rest, hadScheme } = stripScheme(trimmed);
  const segments = stripQueryAndFragment(rest)
    .split("/")
    .filter((segment) => segment.length > 0);

  const first = segments[0] ?? "";
  if (hadScheme || looksLikeHost(first)) {
    if (normalizeHost(first) !== GENERATOR_ACCEPTED_HOST) {
      return fail("unsupported_host");
    }
    segments.shift();
  }

  if (segments.length < 2) return fail("missing_segments");

  const [owner, rawRepo] = segments;
  const ref = parseRepositoryRef(owner, stripGitSuffix(rawRepo));
  return ref.ok ? ok(ref.data) : fail(ref.error);
}
