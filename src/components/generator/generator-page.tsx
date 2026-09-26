import { GeneratorForm } from "@/components/generator/generator-form";
import { GeneratorIntro } from "@/components/generator/generator-intro";
import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { getCanonicalHost } from "@/lib/site-config";

type GeneratorPageProps = {
  locale: Locale;
};

export function GeneratorPage({ locale }: GeneratorPageProps) {
  const dictionary = getDictionary(locale);

  return (
    <GeneratorIntro>
      <div className="flex flex-col gap-4">
        <h1
          data-hero-intro
          data-hero-title
          className="text-5xl font-semibold tracking-[-0.035em] sm:text-6xl"
        >
          {dictionary.generator.title}
        </h1>
        <p
          data-hero-intro
          data-hero-fade
          className="max-w-xl text-lg text-muted"
        >
          {dictionary.generator.subtitle}
        </p>
      </div>
      <GeneratorForm
        locale={locale}
        dictionary={dictionary.generator}
        cardOrigin={getCanonicalHost()}
      />
    </GeneratorIntro>
  );
}
