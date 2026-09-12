import { test } from "@playwright/test";

// The card endpoint (F05) and the validation endpoint (F07) do not exist yet.
// These specs are authored against the F06 module contract and are enabled
// once the two consumer features land.
test.describe.skip("rate limit", () => {
  test("sixty first request is rejected", () => {});
  test("card rejection is an svg card", () => {});
  test("validate rejection is json", () => {});
  test("card exhaustion does not block validate", () => {});
  test("rejected request makes no github call", () => {});
  test("all requests allowed without credentials", () => {});
});
