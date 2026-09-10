import { getGithubToken } from "@/lib/env";
import {
  GITHUB_ACCEPT_HEADER,
  GITHUB_API_BASE_URL,
  GITHUB_API_VERSION,
  GITHUB_USER_AGENT,
} from "@/lib/github/config";
import type { RepositoryRef } from "@/lib/github/types";

export type GithubRequest = {
  url: string;
  headers: Record<string, string>;
};

export function buildRepositoryRequest(
  ref: RepositoryRef,
  token: string | undefined = getGithubToken(),
): GithubRequest {
  const owner = encodeURIComponent(ref.owner);
  const repo = encodeURIComponent(ref.repo);
  const headers: Record<string, string> = {
    Accept: GITHUB_ACCEPT_HEADER,
    "User-Agent": GITHUB_USER_AGENT,
    "X-GitHub-Api-Version": GITHUB_API_VERSION,
  };
  const normalizedToken = typeof token === "string" ? token.trim() : "";
  if (normalizedToken.length > 0) {
    headers.Authorization = `Bearer ${normalizedToken}`;
  }
  return {
    url: `${GITHUB_API_BASE_URL}/repos/${owner}/${repo}`,
    headers,
  };
}
