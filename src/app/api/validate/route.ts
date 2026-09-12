import { handleValidateRequest } from "@/lib/validate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET(request: Request): Promise<Response> {
  return handleValidateRequest(request);
}
