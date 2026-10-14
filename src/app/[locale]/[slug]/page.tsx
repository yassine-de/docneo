import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DocumentIcon, ArrowRightIcon } from "@/components/ui/icons";
import { getDictionary } from "@/i18n/dictionaries";
import { isLocale, locales } from "@/i18n/config";

const slugs = ["login", "privacy", "terms", "imprint", "contact"] as const;
type Slug = (typeof slugs)[number];

function isSlug(value: string): value is Slug {
  return slugs.includes(value as Slug);
}

export function generateStaticParams() {
  return locales.flatMap((locale) => slugs.map((slug) => ({ locale, slug })));
}

export async function generateMetadata({ params }: PageProps<"/[locale]/[slug]">): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale) || !isSlug(slug)) return {};
  const copy = await getDictionary(locale);
  const titles: Record<Slug, string> = {
    login: copy.footer.login,
    privacy: copy.footer.privacy,
    terms: copy.footer.terms,
    imprint: copy.footer.imprint,
    contact: copy.footer.contact,
  };
  return { title: `${titles[slug]} · Docneo`, description: copy.placeholder.text, robots: { index: false, follow: true } };
}

export default async function PlaceholderPage({ params }: PageProps<"/[locale]/[slug]">) {
  const { locale, slug } = await params;
  if (!isLocale(locale) || !isSlug(slug)) notFound();
  const copy = await getDictionary(locale);
  const titles: Record<Slug, string> = { login: copy.footer.login, privacy: copy.footer.privacy, terms: copy.footer.terms, imprint: copy.footer.imprint, contact: copy.footer.contact };
  return (
    <main className="placeholder-page">
      <Link className="logo" href={`/${locale}`}><span><DocumentIcon className="size-5" /></span><strong>docneo</strong></Link>
      <section>
        <p className="eyebrow">{copy.placeholder.badge}</p>
        <h1>{titles[slug]}</h1>
        <h2>{copy.placeholder.title}</h2>
        <p>{copy.placeholder.text}</p>
        <Link className="button button-primary button-large" href={`/${locale}`}>{copy.placeholder.back}<ArrowRightIcon className="size-4" /></Link>
      </section>
    </main>
  );
}
