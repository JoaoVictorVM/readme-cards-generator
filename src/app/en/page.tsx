import type { Metadata } from "next";
import { LandingPage } from "@/components/landing/landing-page";
import { getDictionary } from "@/i18n/get-dictionary";

const dictionary = getDictionary("en");

export const metadata: Metadata = {
  description: dictionary.landing.metaDescription,
};

export default function EnHomePage() {
  return <LandingPage locale="en" />;
}
