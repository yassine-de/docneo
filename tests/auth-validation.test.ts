import test from "node:test";
import assert from "node:assert/strict";
import { loginSchema, profileSchema, resetPasswordSchema, signupSchema } from "../src/features/auth/validation";

test("signup requires a strong matching password and valid profile", () => {
  assert.equal(signupSchema.safeParse({ displayName: "Ada Lovelace", email: "ada@example.com", password: "StrongPass1", confirmPassword: "StrongPass1", locale: "de" }).success, true);
  assert.equal(signupSchema.safeParse({ displayName: "", email: "ada@example.com", password: "StrongPass1", confirmPassword: "StrongPass1", locale: "fr" }).success, true);
  assert.equal(signupSchema.safeParse({ displayName: "A", email: "wrong", password: "weak", confirmPassword: "different", locale: "de" }).success, false);
});

test("login, reset, and profile inputs reject malformed values", () => {
  assert.equal(loginSchema.safeParse({ email: "not-an-email", password: "x" }).success, false);
  assert.equal(resetPasswordSchema.safeParse({ password: "StrongPass1", confirmPassword: "StrongPass2" }).success, false);
  assert.equal(profileSchema.safeParse({ displayName: " ", locale: "fr" }).success, false);
});
