import Link from "next/link";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import type { Locale } from "@/i18n/config";
import { localeHome } from "@/i18n/routing";
import type { Dictionary } from "@/i18n/types";

type SiteHeaderProps = {
  locale: Locale;
  dictionary: Dictionary;
};

export function SiteHeader({ locale, dictionary }: SiteHeaderProps) {
  return (
    <header className="border-b border-[var(--color-border)]">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-4">
        <Link
          href={localeHome(locale)}
          aria-label={dictionary.header.homeLinkLabel}
          className="text-base font-semibold tracking-tight"
        >
          {dictionary.common.productName}
        </Link>
        <LanguageSwitcher locale={locale} dictionary={dictionary} />
      </div>
    </header>
  );
}
