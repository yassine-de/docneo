"use client";

import { AuthForm } from "@/components/auth/auth-form";
import { resetPasswordAction, updateProfileAction } from "@/features/auth/actions";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";

export function SettingsForms({ locale, copy, email, displayName }: { locale: Locale; copy: Dictionary; email: string; displayName: string }) {
  return <div className="settings-grid"><article className="app-card"><h2>{copy.app.settings.profileTitle}</h2><p>{copy.app.settings.profileText}</p><div className="readonly-email"><span>{copy.auth.fields.email}</span><strong>{email}</strong></div><AuthForm locale={locale} action={updateProfileAction} fields={[{ name: "displayName", label: copy.auth.fields.displayName, type: "text", autoComplete: "name", defaultValue: displayName }]} submit={copy.app.settings.save} pending={copy.app.settings.saving} /></article><article className="app-card"><h2>{copy.app.settings.passwordTitle}</h2><p>{copy.app.settings.passwordText}</p><AuthForm locale={locale} action={resetPasswordAction} fields={[{ name: "password", label: copy.auth.fields.newPassword, type: "password", autoComplete: "new-password" }, { name: "confirmPassword", label: copy.auth.fields.confirmPassword, type: "password", autoComplete: "new-password" }]} submit={copy.app.settings.passwordSave} pending={copy.app.settings.saving} passwordHint={copy.auth.passwordHint} /></article></div>;
}
