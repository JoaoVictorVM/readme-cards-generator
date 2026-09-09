import { getDictionary } from "@/i18n/get-dictionary";

export default function EnHomePage() {
  const dictionary = getDictionary("en");

  return (
    <section className="flex flex-col gap-4">
      <h1 className="text-3xl font-semibold tracking-tight">
        {dictionary.landing.title}
      </h1>
      <p className="max-w-2xl text-[var(--color-muted)]">
        {dictionary.landing.subtitle}
      </p>
    </section>
  );
}
