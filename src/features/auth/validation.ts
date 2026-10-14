import { z } from "zod";

const email = z.string().trim().email().max(254);
const password = z.string().min(10).max(128)
  .regex(/[a-z]/, "lowercase")
  .regex(/[A-Z]/, "uppercase")
  .regex(/[0-9]/, "number");

export const loginSchema = z.object({ email, password: z.string().min(1).max(128) });
export const signupSchema = z.object({
  displayName: z.string().trim().max(80).refine((value) => value.length === 0 || value.length >= 2), email, password,
  confirmPassword: z.string(), locale: z.enum(["de", "fr"]),
}).refine((value) => value.password === value.confirmPassword, { path: ["confirmPassword"], message: "mismatch" });
export const forgotPasswordSchema = z.object({ email });
export const resetPasswordSchema = z.object({ password, confirmPassword: z.string() })
  .refine((value) => value.password === value.confirmPassword, { path: ["confirmPassword"], message: "mismatch" });
export const profileSchema = z.object({ displayName: z.string().trim().min(2).max(80), locale: z.enum(["de", "fr"]) });

export type FormResult = { status: "idle" | "success" | "error"; message?: string };
export const initialFormResult: FormResult = { status: "idle" };
