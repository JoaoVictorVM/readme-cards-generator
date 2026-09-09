import type { Dictionary } from "../types";

const dictionary: Dictionary = {
  common: {
    productName: "Badge Generate",
    skipToContent: "Skip to content",
    loading: "Loading...",
  },
  header: {
    homeLinkLabel: "Go to the home page",
    languageSelectorLabel: "Select language",
    switchToPortuguese: "View the site in Portuguese",
    switchToEnglish: "View the site in English",
  },
  footer: {
    repositoryLinkLabel: "Project repository",
    attribution: "Built with Next.js, Bun and a lot of coffee.",
  },
  landing: {
    title: "Repository cards for your README",
    subtitle:
      "Generate an SVG card with the real data of your GitHub repository and paste it straight into your README.",
    ctaGenerate: "Generate my card",
  },
  generator: {
    title: "Generate card",
    subtitle: "Paste the full GitHub repository URL to generate the card.",
    urlFieldLabel: "Repository URL",
    urlFieldPlaceholder: "https://github.com/{owner}/{repo}",
    submitLabel: "Generate",
    copyLabel: "Copy snippet",
    copiedLabel: "Copied!",
  },
  errors: {
    notFoundTitle: "Page not found",
    notFoundMessage: "The address you requested does not exist on this site.",
    unexpectedTitle: "Something went wrong",
    unexpectedMessage: "This page could not be loaded. Please try again.",
    retryLabel: "Try again",
    backHomeLabel: "Back to home",
    repositoryNotFound: "Repository not found or private.",
    invalidUrl: "Enter a valid GitHub repository URL.",
    rateLimited: "Request limit reached. Please try again shortly.",
    upstreamUnavailable: "GitHub did not respond. Please try again shortly.",
  },
};

export default dictionary;
