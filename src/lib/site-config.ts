export const siteConfig = {
  name: "Badge Generate",
  repositoryUrl: "https://github.com/JoaoVictorVM/readme-cards-generator",
  showcaseRepository: { owner: "vercel", name: "next.js" },
} as const;

export function getCanonicalHost(): string {
  const vercelUrl =
    process.env.NEXT_PUBLIC_VERCEL_URL ?? process.env.VERCEL_URL;
  if (vercelUrl && vercelUrl.trim().length > 0) {
    return `https://${vercelUrl.trim()}`;
  }
  return "http://localhost:3000";
}
