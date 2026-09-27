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
    <header className="border-b">
      <div className="container-site flex h-16 items-center justify-between">
        <Link
          href={localeHome(locale)}
          aria-label={dictionary.header.homeLinkLabel}
          className="font-mono text-sm tracking-tight"
        >
          {dictionary.common.productName}
        </Link>
        <LanguageSwitcher locale={locale} dictionary={dictionary} />
      </div>
    </header>
  );
}
