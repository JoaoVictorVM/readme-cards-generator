import {
  GENERATOR_CARD_ROUTE_PREFIX,
  GENERATOR_GITHUB_ORIGIN,
} from "@/lib/generator/config";

export function buildCardPath(owner: string, repo: string): string {
  return `${GENERATOR_CARD_ROUTE_PREFIX}/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`;
}

export function buildCardUrl(
  origin: string,
  owner: string,
  repo: string,
): string {
  return `${origin.replace(/\/+$/, "")}${buildCardPath(owner, repo)}`;
}

export function buildRepositoryUrl(owner: string, repo: string): string {
  return `${GENERATOR_GITHUB_ORIGIN}/${owner}/${repo}`;
}

export function buildMarkdownSnippet(
  origin: string,
  owner: string,
  repo: string,
): string {
  const label = `${owner}/${repo}`;
  return `[![${label}](${buildCardUrl(origin, owner, repo)})](${buildRepositoryUrl(owner, repo)})`;
}
