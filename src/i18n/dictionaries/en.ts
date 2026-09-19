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
    metaDescription:
      "Generate an SVG card with the real data of your GitHub repository and paste it into your README with one line of Markdown.",
    exampleCardAlt: "Example card for the {repository} repository",
    exampleCardCaption: "Example: {repository}",
    heroEyebrow: "One line of Markdown. One SVG card.",
    ctaParameters: "See parameters",
    exampleMarkdownLabel: "Markdown that renders the card below",
    themesTitle: "Two themes, one palette",
    themesIntro:
      "The card is black and white both ways. Pick the theme in the URL and it matches your README background.",
    themeDarkCaption: "dark theme",
    themeLightCaption: "light theme",
    howItWorksTitle: "How it works",
    step1Title: "Paste the repository URL",
    step1Description: "Enter the address of any public GitHub repository.",
    step2Title: "Click Generate",
    step2Description:
      "We validate the repository and build the card from its real data.",
    step3Title: "Copy the Markdown",
    step3Description:
      "Paste the snippet into your README and the card keeps itself up to date.",
    parametersTitle: "URL parameters",
    parametersIntro:
      "The generator uses the defaults below. To customize, add the parameters directly to the card URL.",
    parameterNameHeader: "Parameter",
    parameterValuesHeader: "Allowed values",
    parameterDefaultHeader: "Default",
    parameterDescriptionHeader: "Description",
    themeDescription: "Card palette.",
    localeDescription: "Language of the card copy.",
    widthDescription:
      "Width in pixels, from {min} to {max}. Out-of-range values are clamped to the nearest bound.",
    exampleUrlLabel: "Example URL with all three parameters",
    copyExampleLabel: "Copy URL",
    copiedExampleLabel: "Copied!",
  },
  generator: {
    title: "Generate card",
    subtitle: "Paste the full GitHub repository URL to generate the card.",
    urlFieldLabel: "Repository URL",
    urlFieldPlaceholder: "https://github.com/owner/repo",
    submitLabel: "Generate",
    submittingLabel: "Checking repository...",
    resultHeading: "Your card",
    snippetLabel: "Markdown snippet",
    copyLabel: "Copy snippet",
    copiedLabel: "Copied!",
    copyFallbackLabel: "Select and copy",
    errorInvalidUrl: "Invalid repository URL",
    errorNotFound: "Repository not found or private",
    errorQuotaExhausted: "GitHub limit reached, try again later",
    errorTooManyRequests: "Too many requests, wait a minute",
    errorCouldNotVerify: "Could not verify right now, try again",
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
