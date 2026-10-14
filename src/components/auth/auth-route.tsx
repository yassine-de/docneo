import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthForm } from "./auth-form";
import { AuthShell } from "./auth-shell";
import { GoogleAuthButton } from "./google-auth-button";
import { forgotPasswordAction, loginAction, resetPasswordAction, signupAction } from "@/features/auth/actions";
import { getOptionalUser } from "@/features/auth/session";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";

export type AuthKind = "login" | "signup" | "forgot" | "reset" | "confirmation";

export async function AuthRoute({ locale, copy, kind, next, callbackError }: { locale: Locale; copy: Dictionary; kind: AuthKind; next?: string; callbackError?: boolean }) {
  const user = await getOptionalUser();
  if (user && kind !== "reset") redirect(`/${locale}/dashboard`);
  const auth = copy.auth;

  if (kind === "confirmation") return <AuthShell locale={locale} eyebrow={auth.secure} title={auth.confirmation.title} text={auth.confirmation.text}><div className="auth-card auth-card-center"><div className="mail-mark">✓</div><h2>{auth.confirmation.heading}</h2><p>{auth.confirmation.detail}</p><Link className="button button-primary" href={`/${locale}/login`}>{auth.confirmation.login}</Link></div></AuthShell>;

  const configs = {
    login: { title: auth.login.title, text: auth.login.text, heading: auth.login.heading, action: loginAction, fields: [{ name: "email", label: auth.fields.email, type: "email" as const, autoComplete: "email" }, { name: "password", label: auth.fields.password, type: "password" as const, autoComplete: "current-password" }], submit: auth.login.submit, pending: auth.login.pending, footer: { text: auth.login.noAccount, href: `/${locale}/signup`, label: auth.login.signup } },
    signup: { title: auth.signup.title, text: auth.signup.text, heading: auth.signup.heading, action: signupAction, fields: [{ name: "displayName", label: auth.fields.displayName, type: "text" as const, autoComplete: "name", required: false }, { name: "email", label: auth.fields.email, type: "email" as const, autoComplete: "email" }, { name: "password", label: auth.fields.password, type: "password" as const, autoComplete: "new-password", minLength: 10, pattern: "(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9]).{10,128}" }, { name: "confirmPassword", label: auth.fields.confirmPassword, type: "password" as const, autoComplete: "new-password", minLength: 10 }], submit: auth.signup.submit, pending: auth.signup.pending, footer: { text: auth.signup.hasAccount, href: `/${locale}/login`, label: auth.signup.login } },
    forgot: { title: auth.forgot.title, text: auth.forgot.text, heading: auth.forgot.heading, action: forgotPasswordAction, fields: [{ name: "email", label: auth.fields.email, type: "email" as const, autoComplete: "email" }], submit: auth.forgot.submit, pending: auth.forgot.pending, footer: { text: auth.forgot.remember, href: `/${locale}/login`, label: auth.forgot.login } },
    reset: { title: auth.reset.title, text: auth.reset.text, heading: auth.reset.heading, action: resetPasswordAction, fields: [{ name: "password", label: auth.fields.newPassword, type: "password" as const, autoComplete: "new-password", minLength: 10, pattern: "(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9]).{10,128}" }, { name: "confirmPassword", label: auth.fields.confirmPassword, type: "password" as const, autoComplete: "new-password", minLength: 10 }], submit: auth.reset.submit, pending: auth.reset.pending, footer: { text: auth.reset.back, href: `/${locale}/login`, label: auth.reset.login } },
  } as const;
  const config = configs[kind];
  const showGoogle = kind === "login" || kind === "signup";
  return <AuthShell locale={locale} eyebrow={auth.secure} title={config.title} text={config.text}><div className="auth-card"><div className="auth-card-head"><p className="eyebrow">Docneo Account</p><h2>{config.heading}</h2>{kind === "login" ? <Link href={`/${locale}/forgot-password`}>{auth.login.forgot}</Link> : null}</div>{callbackError ? <p className="form-message error" role="alert">{auth.callbackError}</p> : null}{showGoogle ? <><GoogleAuthButton locale={locale} label={auth.google.continue} pendingLabel={auth.google.pending} errorMessage={auth.google.error} next={next} /><div className="auth-divider"><span>{auth.google.divider}</span></div></> : null}<AuthForm {...config} locale={locale} next={next} passwordHint={kind === "signup" || kind === "reset" ? auth.passwordHint : undefined} /></div></AuthShell>;
}
