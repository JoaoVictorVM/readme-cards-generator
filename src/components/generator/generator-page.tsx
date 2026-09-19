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
    <section className="flex flex-col gap-10 py-4 sm:py-8">
      <div className="flex flex-col gap-4">
        <h1 className="text-4xl font-semibold tracking-[-0.03em] sm:text-5xl">
          {dictionary.generator.title}
        </h1>
        <p className="max-w-xl text-lg text-muted">
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
