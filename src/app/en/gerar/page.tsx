import type { Metadata } from "next";
import { GeneratorForm } from "@/components/generator/generator-form";
import { getDictionary } from "@/i18n/get-dictionary";
import { getCanonicalHost } from "@/lib/site-config";

const dictionary = getDictionary("en");

export const metadata: Metadata = {
  title: dictionary.generator.title,
  description: dictionary.generator.subtitle,
};

export default function EnGeneratorPage() {
  return (
    <section className="flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-semibold tracking-tight">
          {dictionary.generator.title}
        </h1>
        <p className="max-w-2xl text-[var(--color-muted)]">
          {dictionary.generator.subtitle}
        </p>
      </div>
      <GeneratorForm
        locale="en"
        dictionary={dictionary.generator}
        cardOrigin={getCanonicalHost()}
      />
    </section>
  );
}
