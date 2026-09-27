import { GeneratorForm } from "@/components/generator/generator-form";
import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { getCanonicalHost } from "@/lib/site-config";

type GeneratorPageProps = {
  locale: Locale;
};

export function GeneratorPage({ locale }: GeneratorPageProps) {
  const dictionary = getDictionary(locale);

  return (
    <section className="flex flex-col gap-12 py-16 sm:py-24">
      <div className="flex flex-col gap-6">
        <h1 className="type-generator gen-title">
          {dictionary.generator.title}
        </h1>
        <p className="type-lead gen-rise-1 max-w-xl">
          {dictionary.generator.subtitle}
        </p>
      </div>
      <GeneratorForm
        locale={locale}
        dictionary={dictionary.generator}
        cardOrigin={getCanonicalHost()}
      />
    </section>
  );
}
