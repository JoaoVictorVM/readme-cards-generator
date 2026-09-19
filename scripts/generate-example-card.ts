import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { renderCard } from "@/lib/card";
import {
  EXAMPLE_CARD_LIGHT_STATIC_PATH,
  EXAMPLE_CARD_STATIC_PATH,
} from "@/components/landing/config";
import { fetchRepository } from "@/lib/github";
import { resolveLanguageIcon } from "@/lib/language-icon";
import { siteConfig } from "@/lib/site-config";

const { owner, name } = siteConfig.showcaseRepository;
const outcome = await fetchRepository(owner, name);
if (outcome.status !== "ok") {
  console.error(`could not fetch ${owner}/${name}: ${outcome.status}`);
  process.exit(1);
}

const visual = await resolveLanguageIcon(outcome.data.language);
const now = Date.now();
const targets = [
  { theme: "dark", path: EXAMPLE_CARD_STATIC_PATH },
  { theme: "light", path: EXAMPLE_CARD_LIGHT_STATIC_PATH },
] as const;

for (const { theme, path } of targets) {
  const markup = renderCard({ repository: outcome.data, visual, theme, now });
  const target = join("public", path);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, markup, "utf8");
  console.log(`wrote ${target} (${markup.length} bytes)`);
}
