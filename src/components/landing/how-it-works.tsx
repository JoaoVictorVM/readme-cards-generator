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
    <section aria-labelledby="how-it-works" className="flex flex-col gap-8">
      <h2
        id="how-it-works"
        className="text-2xl font-semibold tracking-tight sm:text-3xl"
      >
        {landing.howItWorksTitle}
      </h2>
      <ol className="grid gap-8 border-t pt-8 sm:grid-cols-3 sm:gap-6">
        {steps.map((step, index) => (
          <li key={step.title} className="flex flex-col gap-3">
            <span aria-hidden="true" className="font-mono text-xs text-muted">
              {String(index + 1).padStart(2, "0")}
            </span>
            <h3 className="text-lg font-medium tracking-tight">{step.title}</h3>
            <p className="text-sm leading-relaxed text-muted">
              {step.description}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}
