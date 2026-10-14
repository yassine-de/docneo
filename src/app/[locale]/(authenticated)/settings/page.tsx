import { notFound } from "next/navigation";
import { SettingsForms } from "@/components/app/settings-forms";
import { requireUser } from "@/features/auth/session";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { createClient } from "@/lib/supabase/server";

export default async function SettingsPage({ params }: PageProps<"/[locale]/settings">) { const { locale } = await params; if (!isLocale(locale)) notFound(); const copy = await getDictionary(locale); const user = await requireUser(locale); const supabase = await createClient(); const { data: profile } = supabase ? await supabase.from("profiles").select("display_name").eq("user_id", user.id).maybeSingle() : { data: null }; return <section className="app-page"><div className="app-heading"><div><p className="eyebrow">{copy.app.settings.eyebrow}</p><h1>{copy.app.settings.title}</h1><p>{copy.app.settings.text}</p></div></div><SettingsForms locale={locale} copy={copy} email={user.email} displayName={profile?.display_name ?? ""} /><article className="app-card settings-planned"><h2>{copy.app.settings.plannedTitle}</h2><p>{copy.app.settings.plannedText}</p><span>{copy.app.settings.plannedBadge}</span></article></section>; }
