import type { Dictionary } from "@/i18n/types";

type HowItWorksProps = {
  dictionary: Dictionary;
};

export function HowItWorks({ dictionary }: HowItWorksProps) {
  const { landing } = dictionary;
  const steps = [
    { title: landing.step1Title, description: landing.step1Description },
    { title: landing.step2Title, description: landing.step2Description },
    { title: landing.step3Title, description: landing.step3Description },
  ];

  return (
    <section aria-labelledby="how-it-works" className="flex flex-col gap-6">
      <h2 id="how-it-works" className="text-2xl font-semibold tracking-tight">
        {landing.howItWorksTitle}
      </h2>
      <ol className="grid gap-4 sm:grid-cols-3">
        {steps.map((step, index) => (
          <li
            key={step.title}
            className="flex flex-col gap-2 rounded-[var(--radius-site)] border border-[var(--color-border)] p-5"
          >
            <span
              aria-hidden="true"
              className="text-sm font-semibold text-[var(--color-accent)]"
            >
              {index + 1}
            </span>
            <h3 className="font-medium">{step.title}</h3>
            <p className="text-sm text-[var(--color-muted)]">
              {step.description}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}
