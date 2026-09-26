import type { Repository } from "@/lib/github/types";
import type { LanguageVisual } from "@/lib/language-icon/types";

export type ShowcaseEntry = {
  repository: Repository;
  visual: LanguageVisual;
};

export type ShowcaseData = {
  generatedAt: number;
  showcase: ShowcaseEntry;
  marquee: ShowcaseEntry[];
};
