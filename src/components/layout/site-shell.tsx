import type { ReactNode } from "react";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";

type SiteShellProps = {
  locale: Locale;
  children: ReactNode;
};

export function SiteShell({ locale, children }: SiteShellProps) {
  const dictionary = getDictionary(locale);

  return (
    <div lang={locale} className="flex min-h-dvh flex-col">
      <SiteHeader locale={locale} dictionary={dictionary} />
      <main id="content" className="mx-auto w-full max-w-5xl flex-1 px-6 py-12">
        {children}
      </main>
      <SiteFooter dictionary={dictionary} />
    </div>
  );
}
