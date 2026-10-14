"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { Locale } from "@/i18n/config";
import { isLocale } from "@/i18n/config";
import { getSiteUrl } from "@/lib/site-url";
import { createClient } from "@/lib/supabase/server";
import { safeNextPath } from "./safe-redirect";
import { forgotPasswordSchema, loginSchema, profileSchema, resetPasswordSchema, signupSchema, type FormResult } from "./validation";

const messages = {
  de: { invalid: "Bitte prüfe deine Eingaben.", auth: "E-Mail oder Passwort ist nicht korrekt.", config: "Die Anmeldung ist noch nicht konfiguriert.", sent: "Wenn ein Konto existiert, wurde eine sichere E-Mail versendet.", saved: "Änderungen gespeichert.", password: "Passwort aktualisiert.", failed: "Das hat nicht funktioniert. Bitte versuche es erneut." },
  fr: { invalid: "Vérifiez les informations saisies.", auth: "L’adresse e-mail ou le mot de passe est incorrect.", config: "L’authentification n’est pas encore configurée.", sent: "Si un compte existe, un e-mail sécurisé a été envoyé.", saved: "Modifications enregistrées.", password: "Mot de passe mis à jour.", failed: "Une erreur est survenue. Veuillez réessayer." },
} as const;

function localeFrom(value: FormDataEntryValue | null): Locale {
  return typeof value === "string" && isLocale(value) ? value : "de";
}
function text(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}
function error(locale: Locale, key: keyof typeof messages.de): FormResult {
  return { status: "error", message: messages[locale][key] };
}

export async function loginAction(_previous: FormResult, formData: FormData): Promise<FormResult> {
  const locale = localeFrom(formData.get("locale"));
  const parsed = loginSchema.safeParse({ email: text(formData, "email"), password: text(formData, "password") });
  if (!parsed.success) return error(locale, "invalid");
  const supabase = await createClient();
  if (!supabase) return error(locale, "config");
  const { error: authError } = await supabase.auth.signInWithPassword(parsed.data);
  if (authError) return error(locale, "auth");
  redirect(safeNextPath(text(formData, "next"), locale));
}

export async function signupAction(_previous: FormResult, formData: FormData): Promise<FormResult> {
  const locale = localeFrom(formData.get("locale"));
  const parsed = signupSchema.safeParse({ displayName: text(formData, "displayName"), email: text(formData, "email"), password: text(formData, "password"), confirmPassword: text(formData, "confirmPassword"), locale });
  if (!parsed.success) return error(locale, "invalid");
  const supabase = await createClient();
  if (!supabase) return error(locale, "config");
  const { error: authError } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: { emailRedirectTo: `${getSiteUrl()}/${locale}/auth/callback`, data: { display_name: parsed.data.displayName, locale } },
  });
  if (authError) return error(locale, "failed");
  redirect(`/${locale}/signup/confirmation`);
}

export async function forgotPasswordAction(_previous: FormResult, formData: FormData): Promise<FormResult> {
  const locale = localeFrom(formData.get("locale"));
  const parsed = forgotPasswordSchema.safeParse({ email: text(formData, "email") });
  if (!parsed.success) return error(locale, "invalid");
  const supabase = await createClient();
  if (!supabase) return error(locale, "config");
  await supabase.auth.resetPasswordForEmail(parsed.data.email, { redirectTo: `${getSiteUrl()}/${locale}/auth/callback` });
  return { status: "success", message: messages[locale].sent };
}

export async function resetPasswordAction(_previous: FormResult, formData: FormData): Promise<FormResult> {
  const locale = localeFrom(formData.get("locale"));
  const parsed = resetPasswordSchema.safeParse({ password: text(formData, "password"), confirmPassword: text(formData, "confirmPassword") });
  if (!parsed.success) return error(locale, "invalid");
  const supabase = await createClient();
  if (!supabase) return error(locale, "config");
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims?.sub) redirect(`/${locale}/forgot-password`);
  const { error: authError } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (authError) return error(locale, "failed");
  return { status: "success", message: messages[locale].password };
}

export async function updateProfileAction(_previous: FormResult, formData: FormData): Promise<FormResult> {
  const locale = localeFrom(formData.get("locale"));
  const parsed = profileSchema.safeParse({ displayName: text(formData, "displayName"), locale });
  if (!parsed.success) return error(locale, "invalid");
  const supabase = await createClient();
  if (!supabase) return error(locale, "config");
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) redirect(`/${locale}/login`);
  const { error: profileError } = await supabase.from("profiles").update({ display_name: parsed.data.displayName, locale: parsed.data.locale }).eq("user_id", userId);
  if (profileError) return error(locale, "failed");
  revalidatePath(`/${locale}/settings`);
  return { status: "success", message: messages[locale].saved };
}

export async function logoutAction(formData: FormData) {
  const locale = localeFrom(formData.get("locale"));
  const supabase = await createClient();
  if (supabase) await supabase.auth.signOut();
  redirect(`/${locale}/login`);
}
