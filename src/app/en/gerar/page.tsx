import type { Metadata } from "next";
import { getDictionary } from "@/i18n/get-dictionary";

const dictionary = getDictionary("en");

export const metadata: Metadata = {
  title: dictionary.generator.title,
};

export default function EnGeneratorPage() {
  return (
    <section className="flex flex-col gap-4">
      <h1 className="text-3xl font-semibold tracking-tight">
        {dictionary.generator.title}
      </h1>
      <p className="max-w-2xl text-[var(--color-muted)]">
        {dictionary.generator.subtitle}
      </p>
    </section>
  );
}
