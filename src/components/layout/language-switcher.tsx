"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { locales, localeLabels, type Locale } from "@/i18n/config";
import { switchLocalePath } from "@/i18n/routing";
import type { Dictionary } from "@/i18n/types";
import { cn } from "@/lib/utils";

type LanguageSwitcherProps = {
  locale: Locale;
  dictionary: Dictionary;
};

export function LanguageSwitcher({
  locale,
  dictionary,
}: LanguageSwitcherProps) {
  const pathname = usePathname() ?? "/";

  const titles: Record<Locale, string> = {
    "pt-BR": dictionary.header.switchToPortuguese,
    en: dictionary.header.switchToEnglish,
  };

  return (
    <nav
      aria-label={dictionary.header.languageSelectorLabel}
      className="flex items-center gap-1 text-sm"
    >
      {locales.map((target, index) => {
        const isActive = target === locale;
        return (
          <span key={target} className="flex items-center gap-1">
            {index > 0 ? (
              <span aria-hidden="true" className="text-[var(--color-border)]">
                |
              </span>
            ) : null}
            <Link
              href={switchLocalePath(pathname, target)}
              hrefLang={target}
              aria-current={isActive ? "true" : undefined}
              title={titles[target]}
              className={cn(
                "rounded px-1.5 py-0.5 font-medium transition-colors",
                isActive
                  ? "text-[var(--color-accent)]"
                  : "text-[var(--color-muted)] hover:text-[var(--color-foreground)]",
              )}
            >
              {localeLabels[target]}
            </Link>
          </span>
        );
      })}
    </nav>
  );
}
