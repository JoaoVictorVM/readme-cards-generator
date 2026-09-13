import { CardParameters } from "@/components/landing/card-parameters";
import { GENERATOR_SEGMENT } from "@/components/landing/config";
import { buildExampleCardUrl } from "@/components/landing/example-url";
import { HowItWorks } from "@/components/landing/how-it-works";
import { LandingHero } from "@/components/landing/landing-hero";
import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { buildPath } from "@/i18n/routing";
import { getCanonicalHost } from "@/lib/site-config";

type LandingPageProps = {
  locale: Locale;
};

export function LandingPage({ locale }: LandingPageProps) {
  const dictionary = getDictionary(locale);
  const ctaHref = buildPath(locale, GENERATOR_SEGMENT);
  const exampleUrl = buildExampleCardUrl(getCanonicalHost());

  return (
    <div className="flex flex-col gap-20">
      <LandingHero dictionary={dictionary} ctaHref={ctaHref} />
      <HowItWorks dictionary={dictionary} />
      <CardParameters dictionary={dictionary} exampleUrl={exampleUrl} />
    </div>
  );
}
