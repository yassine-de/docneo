import test from "node:test";
import assert from "node:assert/strict";
import { safeNextPath } from "../src/features/auth/safe-redirect";
import { protectedRedirectFor } from "../src/features/auth/guard";

test("redirect targets stay inside the selected locale", () => {
  assert.equal(safeNextPath("/fr/documents", "fr"), "/fr/documents");
  assert.equal(safeNextPath("https://evil.example", "de"), "/de/dashboard");
  assert.equal(safeNextPath("//evil.example", "de"), "/de/dashboard");
  assert.equal(safeNextPath("/fr/settings", "de"), "/de/dashboard");
});

test("protected routes redirect anonymous users in their language", () => {
  assert.equal(protectedRedirectFor(null, "de"), "/de/login");
  assert.equal(protectedRedirectFor({ id: "user-1" }, "fr"), null);
});
