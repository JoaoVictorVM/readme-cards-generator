import { test } from "@playwright/test";

// The card endpoint (F05) and the validation endpoint (F07) do not exist yet.
// These specs are authored against the F02 contract and are enabled once the
// two consumer features land.
test.describe.skip("github outcome mapping", () => {
  test("normalized fields render in card positions", () => {});
  test("card endpoint maps not_found to 404", () => {});
  test("card endpoint maps rate_limited to 403", () => {});
  test("card endpoint maps upstream_error to 502", () => {});
  test("card endpoint maps unexpected_error to 500", () => {});
  test("validation endpoint maps outcomes to error codes", () => {});
  test("validation endpoint rejects invalid ref before lookup", () => {});
  test("both endpoints agree on existence", () => {});
});
