import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { renderCard } from "@/lib/card";
import {
  EXAMPLE_CARD_STATIC_PATH,
  MARQUEE_REPOSITORIES,
  SHOWCASE_DATA_PATH,
} from "@/components/landing/config";
import type { ShowcaseData } from "@/components/landing/showcase-types";
import { fetchRepository } from "@/lib/github";
import { resolveLanguageIcon } from "@/lib/language-icon";
import { siteConfig } from "@/lib/site-config";

async function load(owner: string, name: string) {
  const outcome = await fetchRepository(owner, name);
  if (outcome.status !== "ok") {
    console.error(`could not fetch ${owner}/${name}: ${outcome.status}`);
    process.exit(1);
  }
  const visual = await resolveLanguageIcon(outcome.data.language, {
    idPrefix: `cg-${owner}-${name}-`.replace(/[^a-zA-Z0-9-]/g, "-"),
  });
  return { repository: outcome.data, visual };
}

const now = Date.now();
const { owner, name } = siteConfig.showcaseRepository;
const showcase = await load(owner, name);
const marquee = [];
for (const entry of MARQUEE_REPOSITORIES) {
  marquee.push(await load(entry.owner, entry.name));
}

const data: ShowcaseData = { generatedAt: now, showcase, marquee };
await writeFile(SHOWCASE_DATA_PATH, `${JSON.stringify(data, null, 2)}\n`);
console.log(`wrote ${SHOWCASE_DATA_PATH} (${marquee.length + 1} repositories)`);

const markup = renderCard({ ...showcase, theme: "dark", now });
const target = join("public", EXAMPLE_CARD_STATIC_PATH);
await mkdir(dirname(target), { recursive: true });
await writeFile(target, markup, "utf8");
console.log(`wrote ${target} (${markup.length} bytes)`);
