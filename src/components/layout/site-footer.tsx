import { ExternalLink } from "lucide-react";
import type { Dictionary } from "@/i18n/types";
import { siteConfig } from "@/lib/site-config";

type SiteFooterProps = {
  dictionary: Dictionary;
};

export function SiteFooter({ dictionary }: SiteFooterProps) {
  return (
    <footer className="border-t border-[var(--color-border)]">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-2 px-6 py-6 text-sm text-[var(--color-muted)] sm:flex-row sm:items-center sm:justify-between">
        <p>{dictionary.footer.attribution}</p>
        <a
          href={siteConfig.repositoryUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 hover:text-[var(--color-foreground)]"
        >
          <ExternalLink aria-hidden="true" className="size-4" />
          {dictionary.footer.repositoryLinkLabel}
        </a>
      </div>
    </footer>
  );
}
