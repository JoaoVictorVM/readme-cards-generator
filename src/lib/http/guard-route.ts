import { logError } from "@/lib/logger";

export type RouteHandler<Args extends unknown[] = []> = (
  request: Request,
  ...args: Args
) => Promise<Response> | Response;

export type FallbackResponseFactory = (error: unknown) => Response;

function errorName(error: unknown): string {
  if (error instanceof Error) return error.name;
  return typeof error;
}

export function guardRoute<Args extends unknown[] = []>(
  routeLabel: string,
  handler: RouteHandler<Args>,
  fallback: FallbackResponseFactory,
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
        return fallback(error);
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
