import { classifyValidationResponse } from "@/lib/generator/classify-validation-response";
import {
  GENERATOR_REQUEST_TIMEOUT_MS,
  GENERATOR_VALIDATE_PARAMETERS,
  GENERATOR_VALIDATE_PATH,
} from "@/lib/generator/config";
import type {
  RequestResolution,
  RequestValidationOptions,
} from "@/lib/generator/types";

const COULD_NOT_VERIFY: RequestResolution = {
  status: "error",
  kind: "could_not_verify",
};

export function buildValidationUrl(owner: string, repo: string): string {
  const query = new URLSearchParams({
    [GENERATOR_VALIDATE_PARAMETERS.owner]: owner,
    [GENERATOR_VALIDATE_PARAMETERS.repo]: repo,
  });
  return `${GENERATOR_VALIDATE_PATH}?${query.toString()}`;
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return undefined;
  }
}

export async function requestValidation(
  owner: string,
  repo: string,
  options: RequestValidationOptions = {},
): Promise<RequestResolution> {
  const {
    signal,
    fetchImplementation = fetch,
    timeoutMs = GENERATOR_REQUEST_TIMEOUT_MS,
  } = options;

  const controller = new AbortController();
  const abortFromCaller = () => controller.abort();
  if (signal?.aborted) return { status: "aborted" };
  signal?.addEventListener("abort", abortFromCaller, { once: true });
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetchImplementation(
      buildValidationUrl(owner, repo),
      {
        method: "GET",
        cache: "no-store",
        headers: { Accept: "application/json" },
        signal: controller.signal,
      },
    );
    const body = await readJson(response);
    return classifyValidationResponse({
      status: response.status,
      retryAfter: response.headers.get("Retry-After"),
      body,
    });
  } catch {
    return signal?.aborted ? { status: "aborted" } : COULD_NOT_VERIFY;
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", abortFromCaller);
  }
}
