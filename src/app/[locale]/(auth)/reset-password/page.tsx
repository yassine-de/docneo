import { Suspense } from "react";
import { notFound } from "next/navigation";
import { AuthRoute } from "@/components/auth/auth-route";
import { getDictionary } from "@/i18n/dictionaries";
import { isLocale } from "@/i18n/config";

export default async function ResetPage({ params }: PageProps<"/[locale]/reset-password">) { const { locale } = await params; if (!isLocale(locale)) notFound(); const copy = await getDictionary(locale); return <Suspense fallback={<main className="route-loading" />}><AuthRoute locale={locale} copy={copy} kind="reset" /></Suspense>; }
