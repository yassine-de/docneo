import Link from "next/link";
import type { ReactNode } from "react";
import { DocumentIcon, HomeIcon } from "@/components/ui/icons";
import { logoutAction } from "@/features/auth/actions";
import { requireUser } from "@/features/auth/session";
import { alternateLocale, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { createClient } from "@/lib/supabase/server";

export async function AppShell({ locale, copy, children }: { locale: Locale; copy: Dictionary; children: ReactNode }) {
  const user = await requireUser(locale);
  const supabase = await createClient();
  const { data: profile } = supabase ? await supabase.from("profiles").select("display_name").eq("user_id", user.id).maybeSingle() : { data: null };
  const name = profile?.display_name || user.email.split("@")[0];
  const pendingLabel = locale === "de" ? "Zu erledigen" : "À traiter";
  const nav = [{ href: `/${locale}/dashboard`, label: copy.app.nav.dashboard, icon: <HomeIcon className="size-5" /> }, { label: copy.app.nav.upload, icon: <span aria-hidden="true">＋</span> }, { href: `/${locale}/documents`, label: copy.app.nav.documents, icon: <DocumentIcon className="size-5" /> }, { href: `/${locale}/pending`, label: pendingLabel, icon: <span aria-hidden="true">✓</span> }, { href: `/${locale}/organisation`, label: copy.app.nav.organisation, icon: <span aria-hidden="true">⌘</span> }, { href: `/${locale}/drive`, label: copy.app.nav.drive, icon: <span aria-hidden="true">△</span> }, { href: `/${locale}/settings`, label: copy.app.nav.settings, icon: <span aria-hidden="true">⚙</span> }];
  return <div className="app-layout"><aside className="app-sidebar"><Link className="logo logo-light" href={`/${locale}`}><span><DocumentIcon className="size-5" /></span><strong>docneo</strong></Link><nav>{nav.map((item) => item.href ? <Link key={item.label} href={item.href}>{item.icon}<span>{item.label}</span></Link> : <span className="nav-planned" key={item.label}>{item.icon}<span>{item.label}</span><small>{copy.app.nav.planned}</small></span>)}</nav><Link className="app-language" href={`/${alternateLocale(locale)}/dashboard`}>{copy.app.nav.language}</Link><div className="app-user"><span>{name.slice(0, 1).toUpperCase()}</span><div><strong>{name}</strong><small>{user.email}</small></div></div><form action={logoutAction}><input type="hidden" name="locale" value={locale} /><button className="sidebar-logout" type="submit">{copy.app.nav.logout}</button></form></aside><main className="app-main"><header className="app-mobile-header"><Link className="logo" href={`/${locale}/dashboard`}><span><DocumentIcon className="size-5" /></span><strong>docneo</strong></Link><nav>{nav.filter((item) => item.href).map((item) => <Link key={item.label} href={item.href!}>{item.label}</Link>)}</nav></header>{children}</main></div>;
}
