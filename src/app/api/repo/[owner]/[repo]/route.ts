import { handleRepoCardRequest, type RepoCardParams } from "@/lib/repo-card";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<RepoCardParams> };

export async function GET(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  const { owner, repo } = await context.params;
  return handleRepoCardRequest(request, { owner, repo });
}
