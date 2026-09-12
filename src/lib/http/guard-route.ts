import { logError } from "@/lib/logger";

export type RouteHandler<Args extends unknown[] = []> = (
  request: Request,
  ...args: Args
) => Promise<Response> | Response;

export type FallbackResponseFactory<Args extends unknown[] = []> = (
  error: unknown,
  request: Request,
  ...args: Args
) => Response;

function errorName(error: unknown): string {
  if (error instanceof Error) return error.name;
  return typeof error;
}

export function guardRoute<Args extends unknown[] = []>(
  routeLabel: string,
  handler: RouteHandler<Args>,
  fallback: FallbackResponseFactory<Args>,
): (request: Request, ...args: Args) => Promise<Response> {
  return async (request, ...args) => {
    try {
      return await handler(request, ...args);
    } catch (error) {
      logError("route handler threw", {
        route: routeLabel,
        error: errorName(error),
      });
      try {
        return fallback(error, request, ...args);
      } catch (fallbackError) {
        logError("route fallback threw", {
          route: routeLabel,
          error: errorName(fallbackError),
        });
        return new Response(null, { status: 500 });
      }
    }
  };
}
