export const siteConfig = {
  name: "Badge Generate",
  repositoryUrl: "https://github.com/JoaoVictorVM/readme-cards-generator",
  showcaseRepository: { owner: "vercel", name: "next.js" },
} as const;

const HOST_ENV_NAMES = [
  "VERCEL_PROJECT_PRODUCTION_URL",
  "NEXT_PUBLIC_VERCEL_URL",
  "VERCEL_URL",
] as const;

export function getCanonicalHost(): string {
  for (const name of HOST_ENV_NAMES) {
    const host = process.env[name]?.trim();
    if (host) return `https://${host}`;
  }
  return "http://localhost:3000";
}
