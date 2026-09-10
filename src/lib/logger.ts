const PREFIX = "[badge-generate]";

const emittedOnce = new Set<string>();

function format(message: string, context?: Record<string, unknown>): string {
  if (!context) return `${PREFIX} ${message}`;
  const parts = Object.entries(context)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => `${key}=${String(value)}`);
  return parts.length > 0
    ? `${PREFIX} ${message} ${parts.join(" ")}`
    : `${PREFIX} ${message}`;
}

export function logWarn(
  message: string,
  context?: Record<string, unknown>,
): void {
  console.warn(format(message, context));
}

export function logError(
  message: string,
  context?: Record<string, unknown>,
): void {
  console.error(format(message, context));
}

export function logWarnOnce(
  key: string,
  message: string,
  context?: Record<string, unknown>,
): void {
  if (emittedOnce.has(key)) return;
  emittedOnce.add(key);
  logWarn(message, context);
}

export function logErrorOnce(
  key: string,
  message: string,
  context?: Record<string, unknown>,
): void {
  if (emittedOnce.has(key)) return;
  emittedOnce.add(key);
  logError(message, context);
}
