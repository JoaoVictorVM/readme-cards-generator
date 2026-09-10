import {
  DEVICON_ACCEPT_HEADER,
  DEVICON_MAX_RESPONSE_BYTES,
  DEVICON_REQUEST_TIMEOUT_MS,
  DEVICON_SUCCESS_STATUS,
  DEVICON_USER_AGENT,
  buildDeviconUrl,
} from "@/lib/language-icon/config";
import type {
  FetchImplementation,
  IconFetchResult,
  LanguageIconVariant,
} from "@/lib/language-icon/types";

const LEADING_NOISE = /^(?:\s|<\?[^>]*\?>|<!DOCTYPE[^>]*>|<!--[\s\S]*?-->)+/i;

export function looksLikeSvgDocument(body: string): boolean {
  return /^<svg[\s>]/i.test(body.replace(LEADING_NOISE, ""));
}

function declaredTooLarge(response: Response): boolean {
  const declared = response.headers.get("content-length");
  if (declared === null) return false;
  const size = Number(declared);
  return Number.isFinite(size) && size > DEVICON_MAX_RESPONSE_BYTES;
}

export async function fetchIconMarkup(
  slug: string,
  variant: LanguageIconVariant,
  fetchImpl?: FetchImplementation,
): Promise<IconFetchResult> {
  const url = buildDeviconUrl(slug, variant);
  const impl: FetchImplementation =
    fetchImpl ?? ((target, init) => globalThis.fetch(target, init));

  const controller = new AbortController();
  const timer = setTimeout(
    () => controller.abort(),
    DEVICON_REQUEST_TIMEOUT_MS,
  );

  try {
    let response: Response;
    try {
      response = await impl(url, {
        method: "GET",
        headers: {
          Accept: DEVICON_ACCEPT_HEADER,
          "User-Agent": DEVICON_USER_AGENT,
        },
        redirect: "follow",
        cache: "no-store",
        signal: controller.signal,
      });
    } catch {
      if (controller.signal.aborted) return { ok: false, cause: "timeout" };
      return { ok: false, cause: "transport_error" };
    }

    if (response.status !== DEVICON_SUCCESS_STATUS) {
      return { ok: false, cause: "http_error" };
    }
    if (declaredTooLarge(response)) {
      return { ok: false, cause: "too_large" };
    }

    let body: string;
    try {
      body = await response.text();
    } catch {
      if (controller.signal.aborted) return { ok: false, cause: "timeout" };
      return { ok: false, cause: "transport_error" };
    }

    if (
      new TextEncoder().encode(body).byteLength > DEVICON_MAX_RESPONSE_BYTES
    ) {
      return { ok: false, cause: "too_large" };
    }
    if (!looksLikeSvgDocument(body)) {
      return { ok: false, cause: "not_svg" };
    }

    return { ok: true, markup: body };
  } catch {
    if (controller.signal.aborted) return { ok: false, cause: "timeout" };
    return { ok: false, cause: "transport_error" };
  } finally {
    clearTimeout(timer);
  }
}
