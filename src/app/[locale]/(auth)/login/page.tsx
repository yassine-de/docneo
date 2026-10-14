import { Suspense } from "react";
import { notFound } from "next/navigation";
import { AuthRoute } from "@/components/auth/auth-route";
import { getDictionary } from "@/i18n/dictionaries";
import { isLocale } from "@/i18n/config";

export const instant = false;

export default async function LoginPage({ params, searchParams }: PageProps<"/[locale]/login">) {
  const [{ locale }, query] = await Promise.all([params, searchParams]);
  if (!isLocale(locale)) notFound();
  const copy = await getDictionary(locale);
  const next = typeof query.next === "string" ? query.next : undefined;
  return <Suspense fallback={<main className="route-loading" />}><AuthRoute locale={locale} copy={copy} kind="login" next={next} callbackError={query.error === "auth_callback"} /></Suspense>;
}
