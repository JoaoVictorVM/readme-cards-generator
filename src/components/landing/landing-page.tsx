import { CardAnatomy } from "@/components/landing/card-anatomy";
import { CardAssembly } from "@/components/landing/card-assembly";
import { CardParameters } from "@/components/landing/card-parameters";
import { CardPlayground } from "@/components/landing/card-playground";
import { GENERATOR_SEGMENT } from "@/components/landing/config";
import {
  buildExampleCardUrl,
  buildShowcaseCardUrl,
} from "@/components/landing/example-url";
import { HowItWorks } from "@/components/landing/how-it-works";
import { LandingClosing } from "@/components/landing/landing-closing";
import { LandingHero } from "@/components/landing/landing-hero";
import { RepoMarquee } from "@/components/landing/repo-marquee";
import showcaseData from "@/components/landing/showcase-data.json";
import type { ShowcaseData } from "@/components/landing/showcase-types";
import { Wordmark } from "@/components/landing/wordmark";
import { SmoothScroll } from "@/components/motion/smooth-scroll";
import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { buildPath } from "@/i18n/routing";
import { renderCard } from "@/lib/card";
import { buildMarkdownSnippet, buildRepositoryUrl } from "@/lib/generator";
import { getCanonicalHost } from "@/lib/site-config";

type LandingPageProps = {
  locale: Locale;
};

const data = showcaseData as unknown as ShowcaseData;

export function LandingPage({ locale }: LandingPageProps) {
  const dictionary = getDictionary(locale);
  const ctaHref = buildPath(locale, GENERATOR_SEGMENT);
  const host = getCanonicalHost();
  const exampleUrl = buildExampleCardUrl(host);
  const cardUrl = buildShowcaseCardUrl(host);
  const { owner, name, fullName } = data.showcase.repository;
  const cardMarkup = renderCard({
    ...data.showcase,
    theme: "dark",
    locale,
    now: data.generatedAt,
  });

  return (
    <div className="flex flex-col gap-[var(--section-gap)]">
      <SmoothScroll />
      <LandingHero dictionary={dictionary} ctaHref={ctaHref} />
      <CardAssembly
        dictionary={dictionary}
        repositoryUrl={buildRepositoryUrl(owner, name)}
        repository={fullName}
        cardMarkup={cardMarkup}
        snippet={buildMarkdownSnippet(host, owner, name)}
      />
      <CardAnatomy dictionary={dictionary} cardMarkup={cardMarkup} />
      <HowItWorks dictionary={dictionary} />
      <RepoMarquee dictionary={dictionary} data={data} />
      <CardPlayground
        dictionary={dictionary}
        entry={data.showcase}
        now={data.generatedAt}
        baseUrl={cardUrl}
      />
      <CardParameters dictionary={dictionary} exampleUrl={exampleUrl} />
      <LandingClosing
        dictionary={dictionary}
        ctaHref={ctaHref}
        cardUrl={cardUrl}
      />
      <Wordmark text={dictionary.common.productName} />
    </div>
  );
}
