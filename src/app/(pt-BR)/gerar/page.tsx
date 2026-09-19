import type { Metadata } from "next";
import { GeneratorPage } from "@/components/generator/generator-page";
import { getDictionary } from "@/i18n/get-dictionary";

const dictionary = getDictionary("pt-BR");

export const metadata: Metadata = {
  title: dictionary.generator.title,
  description: dictionary.generator.subtitle,
};

export default function PtBrGeneratorPage() {
  return <GeneratorPage locale="pt-BR" />;
}
