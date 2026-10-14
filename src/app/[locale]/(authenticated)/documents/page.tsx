import { notFound } from "next/navigation";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

export default async function DocumentsPage({ params }: PageProps<"/[locale]/documents">) { const { locale } = await params; if (!isLocale(locale)) notFound(); const { app } = await getDictionary(locale); return <section className="app-page"><div className="app-heading"><div><p className="eyebrow">{app.documents.eyebrow}</p><h1>{app.documents.title}</h1><p>{app.documents.text}</p></div></div><article className="app-card app-empty"><span className="empty-document">▤</span><h2>{app.documents.emptyTitle}</h2><p>{app.documents.emptyText}</p></article></section>; }
