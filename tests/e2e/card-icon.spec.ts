import { test } from "@playwright/test";

// The card renderer (F04) and the card endpoint (F05) do not exist yet. These
// specs are authored against the F03 module contract and are enabled once the
// two consumer features land.
test.describe.skip("language icon inlined in the card", () => {
  test("resolved icon markup appears inlined in the card svg", () => {});
  test("resolved tile color is the tile fill in the card", () => {});
  test("namespaces survive into the card document", () => {});
  test("card svg has zero external references", () => {});
  test("two cards on one page do not collide", () => {});
  test("language without an icon still produces a filled tile", () => {});
});
