"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import type { FormResult } from "@/features/auth/validation";
import { initialFormResult } from "@/features/auth/validation";
import type { Locale } from "@/i18n/config";

type Field = { name: string; label: string; type: "email" | "password" | "text"; autoComplete: string; defaultValue?: string; readOnly?: boolean; required?: boolean; minLength?: number; pattern?: string };
type Props = {
  action: (state: FormResult, formData: FormData) => Promise<FormResult>;
  locale: Locale; fields: readonly Field[]; submit: string; pending: string;
  next?: string; passwordHint?: string; footer?: { text: string; href: string; label: string };
};

export function AuthForm({ action, locale, fields, submit, pending, next, passwordHint, footer }: Props) {
  const [state, formAction, isPending] = useActionState(action, initialFormResult);
  const [showPassword, setShowPassword] = useState(false);
  const [passwords, setPasswords] = useState({ password: "", confirmPassword: "" });
  const passwordsMismatch = Boolean(passwords.confirmPassword && passwords.password !== passwords.confirmPassword);
  return (
    <form action={formAction} className="auth-form">
      <input type="hidden" name="locale" value={locale} />
      {next ? <input type="hidden" name="next" value={next} /> : null}
      {fields.map((field) => (
        <label key={field.name}>
          <span>{field.label}</span>
          <input name={field.name} type={field.type === "password" && showPassword ? "text" : field.type} autoComplete={field.autoComplete} defaultValue={field.defaultValue} readOnly={field.readOnly} required={field.required ?? true} minLength={field.minLength} pattern={field.pattern} onChange={field.type === "password" ? (event) => setPasswords((current) => ({ ...current, [field.name]: event.target.value })) : undefined} />
        </label>
      ))}
      {fields.some((field) => field.type === "password") ? (
        <label className="auth-check"><input type="checkbox" checked={showPassword} onChange={(event) => setShowPassword(event.target.checked)} /> <span>{locale === "de" ? "Passwort anzeigen" : "Afficher le mot de passe"}</span></label>
      ) : null}
      {passwordHint ? <p className="field-hint">{passwordHint}</p> : null}
      {passwordsMismatch ? <p className="form-message error" role="alert">{locale === "de" ? "Die Passwörter stimmen nicht überein." : "Les mots de passe ne correspondent pas."}</p> : null}
      {state.message ? <p className={`form-message ${state.status}`} role="status">{state.message}</p> : null}
      <button className="button button-primary" type="submit" disabled={isPending || passwordsMismatch}>{isPending ? pending : submit}</button>
      {footer ? <p className="auth-footer">{footer.text} <Link href={footer.href}>{footer.label}</Link></p> : null}
    </form>
  );
}
