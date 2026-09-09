import type { Metadata } from "next";
import type { ReactNode } from "react";
import { SiteShell } from "@/components/layout/site-shell";
import { getDictionary } from "@/i18n/get-dictionary";

const dictionary = getDictionary("en");

export const metadata: Metadata = {
  title: {
    default: dictionary.common.productName,
    template: `%s · ${dictionary.common.productName}`,
  },
  description: dictionary.landing.subtitle,
};

export default function EnLayout({ children }: { children: ReactNode }) {
  return <SiteShell locale="en">{children}</SiteShell>;
}
