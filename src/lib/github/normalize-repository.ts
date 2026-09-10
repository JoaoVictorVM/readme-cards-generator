import { fail, ok, type Result } from "@/lib/result";
import type { Repository } from "@/lib/github/types";

export type NormalizationFailure = "missing_fields";

function requiredString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function normalizeRepository(
  body: unknown,
): Result<Repository, NormalizationFailure> {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return fail("missing_fields", "body");
  }

  const payload = body as Record<string, unknown>;
  const ownerObject = payload.owner;
  const ownerLogin =
    typeof ownerObject === "object" && ownerObject !== null
      ? (ownerObject as Record<string, unknown>).login
      : undefined;

  if (!requiredString(ownerLogin)) return fail("missing_fields", "owner.login");
  if (!requiredString(payload.name)) return fail("missing_fields", "name");
  if (!requiredString(payload.full_name))
    return fail("missing_fields", "full_name");
  if (!requiredString(payload.html_url))
    return fail("missing_fields", "html_url");
  if (!requiredString(payload.pushed_at))
    return fail("missing_fields", "pushed_at");
  if (Number.isNaN(Date.parse(payload.pushed_at as string)))
    return fail("missing_fields", "pushed_at");

  const rawLanguage = payload.language;
  if (rawLanguage !== null && typeof rawLanguage !== "string") {
    return fail("missing_fields", "language");
  }
  const language =
    typeof rawLanguage === "string" && rawLanguage.trim().length > 0
      ? rawLanguage
      : null;

  return ok({
    owner: ownerLogin,
    name: payload.name as string,
    fullName: payload.full_name as string,
    language,
    pushedAt: payload.pushed_at as string,
    htmlUrl: payload.html_url as string,
  });
}
