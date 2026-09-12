import {
  resolveCardLocale,
  resolveCardTheme,
  resolveCardWidth,
} from "@/lib/card";
import { REPO_CARD_QUERY_PARAMETERS } from "@/lib/repo-card/config";
import type {
  RepoCardOptions,
  RepoCardQueryParameterName,
} from "@/lib/repo-card/types";

function readParameter(
  params: URLSearchParams,
  name: RepoCardQueryParameterName,
): string | null {
  return params.get(REPO_CARD_QUERY_PARAMETERS[name]);
}

export function readCardOptions(request: Request): RepoCardOptions {
  const params = new URL(request.url).searchParams;
  return {
    theme: resolveCardTheme(readParameter(params, "theme")),
    locale: resolveCardLocale(readParameter(params, "locale")),
    width: resolveCardWidth(readParameter(params, "width")),
  };
}
