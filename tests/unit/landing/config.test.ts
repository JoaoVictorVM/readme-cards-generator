import { describe, expect, test } from "bun:test";
import { EXAMPLE_CARD_QUERY_PARAMETERS } from "@/components/landing/config";
import { REPO_CARD_QUERY_PARAMETERS } from "@/lib/repo-card/config";

describe("landing config", () => {
  test("query parameter names match the repo-card module", () => {
    expect(EXAMPLE_CARD_QUERY_PARAMETERS).toEqual(REPO_CARD_QUERY_PARAMETERS);
  });
});
