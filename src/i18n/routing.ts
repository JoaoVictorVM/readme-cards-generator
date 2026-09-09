import { defaultLocale, localePrefixes, type Locale } from "./config";

const routeSegments = ["", "gerar"] as const;

export function localeHome(locale: Locale): string {
  return localePrefixes[locale] === "" ? "/" : localePrefixes[locale];
}

export function getLocaleFromPathname(pathname: string): Locale {
  const normalized = normalize(pathname);
  return normalized === "/en" || normalized.startsWith("/en/")
    ? "en"
    : defaultLocale;
}

export function getRouteSegment(pathname: string): string | null {
  const normalized = normalize(pathname);
  const locale = getLocaleFromPathname(normalized);
  const prefix = localePrefixes[locale];
  const rest = normalized.slice(prefix.length) || "/";
  const segment = rest.replace(/^\/+/, "").replace(/\/+$/, "");
  return (routeSegments as readonly string[]).includes(segment)
    ? segment
    : null;
}

export function buildPath(locale: Locale, segment: string): string {
  const prefix = localePrefixes[locale];
  const clean = segment.replace(/^\/+/, "").replace(/\/+$/, "");
  if (clean === "") return localeHome(locale);
  return `${prefix}/${clean}`;
}

export function switchLocalePath(pathname: string, target: Locale): string {
  const segment = getRouteSegment(pathname);
  if (segment === null) return localeHome(target);
  return buildPath(target, segment);
}

function normalize(pathname: string): string {
  if (!pathname.startsWith("/")) return `/${pathname}`;
  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.replace(/\/+$/, "") || "/";
  }
  return pathname;
}
