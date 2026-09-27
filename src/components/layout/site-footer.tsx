import { ExternalLink } from "lucide-react";
import type { Dictionary } from "@/i18n/types";
import { siteConfig } from "@/lib/site-config";

type SiteFooterProps = {
  dictionary: Dictionary;
};

export function SiteFooter({ dictionary }: SiteFooterProps) {
  return (
    <footer className="border-t">
      <div className="container-site caption flex flex-col gap-3 py-8 sm:flex-row sm:items-center sm:justify-between">
        <p>{dictionary.footer.attribution}</p>
        <a
          href={siteConfig.repositoryUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 transition-colors duration-200 hover:text-foreground"
        >
          <ExternalLink aria-hidden="true" className="size-3.5" />
          {dictionary.footer.repositoryLinkLabel}
        </a>
      </div>
    </footer>
  );
}
