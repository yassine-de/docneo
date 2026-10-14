import { notFound } from "next/navigation";
import { OrganizationOnboarding } from "@/components/app/organization-onboarding";
import { requireUser } from "@/features/auth/session";
import { getDriveConnection } from "@/features/drive/repository";
import { phase4Copy } from "@/features/organization/copy";
import { isLocale } from "@/i18n/config";

export default async function OrganisationPage({ params }: { params: Promise<{ locale: string }> }) { const { locale } = await params; if (!isLocale(locale)) notFound(); const user = await requireUser(locale); const connection = await getDriveConnection(user.id); const copy = phase4Copy[locale].org; return <section className="app-page"><div className="app-heading"><div><p className="eyebrow">{copy.eyebrow}</p><h1>{copy.title}</h1><p>{copy.text}</p></div></div><OrganizationOnboarding locale={locale} userId={user.id} canConfirm={Boolean(connection?.status === "active" && connection.root_folder_id)} rootName={connection?.root_folder_name ?? undefined} /></section>; }
