import { notFound } from "next/navigation";
import { LandingPage } from "@/components/landing/landing-page";
import { getDictionary } from "@/i18n/dictionaries";
import { isLocale } from "@/i18n/config";

export default async function Page({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const copy = await getDictionary(locale);
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Docneo",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    description: copy.meta.description,
    inLanguage: locale,
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }} />
      <LandingPage locale={locale} copy={copy} />
    </>
  );
}
