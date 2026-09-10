import { describe, expect, test } from "bun:test";
import { buildDeviconUrl } from "@/lib/language-icon/config";
import { LANGUAGE_TABLE } from "@/lib/language-icon/language-map";
import { looksLikeSvgDocument } from "@/lib/language-icon/devicon-client";

// Opt-in: this suite lives outside `tests/unit`, so `bun test` (which the
// project's `test` script scopes to `tests/unit`) stays hermetic. Run it with
// `bun test tests/network` when re-pinning the Devicon release.
describe("devicon availability at the pinned release", () => {
  test("every mapped slug resolves at the pinned release", async () => {
    const broken: string[] = [];
    for (const entry of LANGUAGE_TABLE) {
      const url = buildDeviconUrl(entry.slug, entry.variant);
      const response = await fetch(url);
      if (!response.ok) {
        broken.push(`${entry.language} ${response.status} ${url}`);
        continue;
      }
      if (!looksLikeSvgDocument(await response.text())) {
        broken.push(`${entry.language} not-svg ${url}`);
      }
    }
    expect(broken).toEqual([]);
  }, 120_000);
});
