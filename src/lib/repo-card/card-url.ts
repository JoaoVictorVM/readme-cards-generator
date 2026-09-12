import { REPO_CARD_ROUTE_PREFIX } from "@/lib/repo-card/config";

export function buildCardPath(owner: string, repo: string): string {
  return `${REPO_CARD_ROUTE_PREFIX}/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`;
}
