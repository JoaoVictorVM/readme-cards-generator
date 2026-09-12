import { test } from "@playwright/test";

// The card endpoint (F05) does not exist yet. These specs are authored against
// the F04 module contract and are enabled once the endpoint lands.
test.describe.skip("card renderer through the endpoint", () => {
  test("card markup is returned unmodified", () => {});
  test("error card markup is returned unmodified", () => {});
  test("theme locale width reach the renderer", () => {});
  test("invalid parameters fall back to renderer defaults", () => {});
  test("every status body is a renderer document", () => {});
  test("name in bold text position and link target", () => {});
});
