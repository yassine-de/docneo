import { notFound } from "next/navigation";
import { phase4Copy } from "@/features/organization/copy";
import { isLocale } from "@/i18n/config";

export default async function PendingPage({ params }: { params: Promise<{ locale: string }> }) { const { locale } = await params; if (!isLocale(locale)) notFound(); const copy = phase4Copy[locale].pending; return <section className="app-page"><div className="app-heading"><div><p className="eyebrow">{copy.eyebrow}</p><h1>{copy.title}</h1><p>{copy.text}</p></div></div><article className="app-card app-empty"><span className="empty-document">✓</span><h2>{copy.empty}</h2><p>{copy.honest}</p></article></section>; }
