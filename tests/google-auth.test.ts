import test from "node:test";
import assert from "node:assert/strict";
import { GOOGLE_IDENTITY_SCOPES, googleOAuthRedirectTo } from "../src/features/auth/google";

test("Google login requests identity scopes only", () => {
  assert.deepEqual(GOOGLE_IDENTITY_SCOPES.split(" "), ["openid", "email", "profile"]);
  assert.doesNotMatch(GOOGLE_IDENTITY_SCOPES, /drive|storage|documents/i);
});

test("Google callback stays on the current origin and preserves only safe app redirects", () => {
  assert.equal(
    googleOAuthRedirectTo("https://docneo-codex.netlify.app", "fr", "/fr/settings"),
    "https://docneo-codex.netlify.app/fr/auth/callback?next=%2Ffr%2Fsettings",
  );
  assert.equal(
    googleOAuthRedirectTo("http://localhost:3000", "de", "https://evil.example"),
    "http://localhost:3000/de/auth/callback?next=%2Fde%2Fdashboard",
  );
});
