import { Suspense } from "react";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app/app-shell";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

export const instant = false;

export default async function AuthenticatedLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const copy = await getDictionary(locale);
  return <Suspense fallback={<main className="route-loading" />}><AppShell locale={locale} copy={copy}>{children}</AppShell></Suspense>;
}
