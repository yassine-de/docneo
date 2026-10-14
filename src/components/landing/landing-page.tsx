import Link from "next/link";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import { alternateLocale } from "@/i18n/config";
import { ProductDemo } from "./product-demo";
import {
  ArrowRightIcon,
  BuildingIcon,
  CheckIcon,
  CloudIcon,
  DocumentIcon,
  HomeIcon,
  LockIcon,
  ScanIcon,
  SparklesIcon,
  UploadIcon,
  UsersIcon,
} from "@/components/ui/icons";

export function LandingPage({ locale, copy }: { locale: Locale; copy: Dictionary }) {
  const otherLocale = alternateLocale(locale);
  const audienceIcons = [UsersIcon, HomeIcon, BuildingIcon];
  const howIcons = [UploadIcon, SparklesIcon, CheckIcon];

  return (
    <main className="overflow-hidden">
      <header className="site-header">
        <div className="page-container flex h-20 items-center justify-between">
          <Logo locale={locale} />
          <nav className="hidden items-center gap-7 lg:flex" aria-label="Main navigation">
            <a href="#how">{copy.nav.how}</a>
            <a href="#for-whom">{copy.nav.forWhom}</a>
            <a href="#security">{copy.nav.security}</a>
            <a href="#pricing">{copy.nav.pricing}</a>
          </nav>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link className="language-link" href={`/${otherLocale}`} hrefLang={otherLocale}>{copy.nav.language}</Link>
            <Link className="button button-ghost hidden sm:inline-flex" href={`/${locale}/login`}>{copy.nav.login}</Link>
            <a className="button button-primary button-small" href="#demo">{copy.nav.demo}</a>
          </div>
        </div>
      </header>

      <section className="hero-section">
        <div className="hero-orb hero-orb-one" /><div className="hero-orb hero-orb-two" />
        <div className="page-container relative grid items-center gap-16 py-20 lg:grid-cols-[1.02fr_.98fr] lg:py-28">
          <div className="max-w-2xl">
            <p className="eyebrow"><SparklesIcon className="size-4" />{copy.hero.eyebrow}</p>
            <h1 className="hero-title"><span>{copy.hero.titleLine1}</span><strong>{copy.hero.titleLine2}</strong></h1>
            <p className="hero-copy">{copy.hero.subtitle}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a className="button button-primary button-large" href="#demo">{copy.hero.primary}<ArrowRightIcon className="size-4" /></a>
              <a className="button button-secondary button-large" href="#how">{copy.hero.secondary}</a>
            </div>
            <div className="mt-7 flex flex-col gap-2 text-sm text-slate-500 sm:flex-row sm:gap-6">
              <span className="inline-flex items-center gap-2"><CheckIcon className="size-4 text-emerald-600" />{copy.hero.trust}</span>
              <span className="inline-flex items-center gap-2"><DocumentIcon className="size-4 text-blue-600" />{copy.hero.formats}</span>
            </div>
          </div>
          <HeroVisual copy={copy} />
        </div>
      </section>

      <section id="demo" className="section section-paper scroll-mt-20">
        <div className="page-container">
          <SectionHeading eyebrow={copy.demo.eyebrow} title={copy.demo.title} description={copy.demo.description} centered />
          <div className="mx-auto mt-12 max-w-6xl"><ProductDemo copy={copy.demo} /></div>
        </div>
      </section>

      <section id="how" className="section scroll-mt-20">
        <div className="page-container">
          <SectionHeading eyebrow={copy.how.eyebrow} title={copy.how.title} description={copy.how.description} />
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {copy.how.items.map((item, index) => {
              const Icon = howIcons[index];
              return (
                <article className="step-card" key={item.title}>
                  <span className="step-number">0{index + 1}</span>
                  <div className="icon-tile"><Icon className="size-6" /></div>
                  <h3>{item.title}</h3><p>{item.text}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section id="for-whom" className="section section-ink scroll-mt-20">
        <div className="page-container">
          <SectionHeading eyebrow={copy.audiences.eyebrow} title={copy.audiences.title} description={copy.audiences.description} light />
          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            {copy.audiences.items.map((item, index) => {
              const Icon = audienceIcons[index];
              return (
                <article className="audience-card" key={item.kind}>
                  <div className="audience-icon"><Icon className="size-7" /></div>
                  <span>{item.kind}</span><h3>{item.title}</h3><p>{item.text}</p>
                  <div className="mt-7 flex flex-wrap gap-2">{item.tags.map((tag) => <small key={tag}>{tag}</small>)}</div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="section section-paper">
        <div className="page-container grid items-center gap-14 lg:grid-cols-2">
          <div>
            <p className="eyebrow"><CloudIcon className="size-4" />{copy.drive.eyebrow}</p>
            <h2 className="section-title">{copy.drive.title}</h2>
            <p className="section-copy">{copy.drive.description}</p>
            <ul className="check-list">
              {copy.drive.points.map((point) => <li key={point}><span><CheckIcon className="size-4" /></span>{point}</li>)}
            </ul>
            <p className="integration-note"><span />{copy.drive.note}</p>
          </div>
          <DriveVisual copy={copy.drive} />
        </div>
      </section>

      <section id="security" className="section scroll-mt-20">
        <div className="page-container">
          <div className="security-panel">
            <div className="security-heading">
              <p className="eyebrow"><LockIcon className="size-4" />{copy.security.eyebrow}</p>
              <h2 className="section-title">{copy.security.title}</h2>
              <p className="section-copy">{copy.security.description}</p>
            </div>
            <div className="security-items">
              {copy.security.items.map((item, index) => (
                <article key={item.title}><span>0{index + 1}</span><div><h3>{item.title}</h3><p>{item.text}</p></div></article>
              ))}
            </div>
            <p className="security-disclaimer"><LockIcon className="size-4 shrink-0" />{copy.security.disclaimer}</p>
          </div>
        </div>
      </section>

      <section id="pricing" className="section section-paper scroll-mt-20">
        <div className="page-container">
          <SectionHeading eyebrow={copy.pricing.eyebrow} title={copy.pricing.title} description={copy.pricing.description} centered />
          <div className="pricing-grid">
            {copy.pricing.plans.map((plan, index) => (
              <article className={index === 2 ? "price-card featured" : "price-card"} key={plan.name}>
                <div className="flex items-center justify-between gap-3"><h3>{plan.name}</h3><span>{copy.pricing.badge}</span></div>
                <p className="price"><strong>{plan.price}</strong><small>{copy.pricing.month}</small></p>
                <p className="plan-for">{plan.for}</p>
                <a href="#final-cta" className="button button-secondary w-full">{copy.pricing.cta}</a>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="page-container grid gap-12 lg:grid-cols-[.72fr_1.28fr]">
          <div><p className="eyebrow">{copy.faq.eyebrow}</p><h2 className="section-title">{copy.faq.title}</h2></div>
          <div className="faq-list">
            {copy.faq.items.map((item, index) => (
              <details key={item.q} open={index === 0}><summary>{item.q}<span>+</span></summary><p>{item.a}</p></details>
            ))}
          </div>
        </div>
      </section>

      <section id="final-cta" className="pb-5 sm:pb-8">
        <div className="page-container">
          <div className="final-cta">
            <ScanIcon className="cta-scan" />
            <p>{copy.final.eyebrow}</p><h2>{copy.final.title}</h2><span>{copy.final.text}</span>
            <a className="button button-light button-large" href="#demo">{copy.final.cta}<ArrowRightIcon className="size-4" /></a>
          </div>
        </div>
      </section>

      <Footer locale={locale} copy={copy} />
    </main>
  );
}

function SectionHeading({ eyebrow, title, description, centered, light }: { eyebrow: string; title: string; description: string; centered?: boolean; light?: boolean }) {
  return <div className={`${centered ? "mx-auto text-center" : ""} max-w-2xl`}><p className={`eyebrow ${centered ? "justify-center" : ""} ${light ? "eyebrow-light" : ""}`}>{eyebrow}</p><h2 className={`section-title ${light ? "text-white" : ""}`}>{title}</h2><p className={`section-copy ${light ? "text-slate-300" : ""}`}>{description}</p></div>;
}

function Logo({ locale }: { locale: Locale }) {
  return <Link className="logo" href={`/${locale}`} aria-label="Docneo home"><span><DocumentIcon className="size-5" /></span><strong>docneo</strong></Link>;
}

function HeroVisual({ copy }: { copy: Dictionary }) {
  return (
    <div className="hero-visual" aria-hidden="true">
      <div className="hero-document">
        <div className="hero-doc-top"><span>RECHNUNG</span><small>14.10.2026</small></div>
        <div className="hero-doc-mark"><span>T</span><div><b>TELEKOM</b><i>Deutschland GmbH</i></div></div>
        <div className="hero-doc-lines"><i /><i /><i /></div>
        <div className="hero-doc-price"><small>Rechnungsbetrag</small><strong>49,95 €</strong></div>
        <div className="hero-doc-lines"><i /><i /><i /></div>
      </div>
      <div className="hero-ai-card">
        <span className="ai-icon"><SparklesIcon className="size-5" /></span>
        <div><small>DOCNEO AI</small><strong>{copy.demo.fields.typeValue}</strong></div>
        <span className="ai-confidence">96%</span>
      </div>
      <div className="hero-folder-card"><CloudIcon className="size-5" /><div><small>GOOGLE DRIVE</small><strong>{copy.demo.fields.folderValue}</strong></div><CheckIcon className="size-4 text-emerald-600" /></div>
      <div className="hero-float-label"><ScanIcon className="size-4" />{copy.hero.trust}</div>
    </div>
  );
}

function DriveVisual({ copy }: { copy: Dictionary["drive"] }) {
  return (
    <div className="drive-visual">
      <div className="drive-window">
        <div className="drive-bar"><span /><span /><span /><small>drive.google.com</small></div>
        <div className="drive-body">
          <aside><div className="drive-logo"><CloudIcon className="size-5" /></div>{[1,2,3,4].map((n) => <i key={n} />)}</aside>
          <div className="drive-content"><small>{copy.folder}</small><div className="folder-row"><span>▰</span><i /></div><div className="file-row"><DocumentIcon className="size-6 text-blue-600" /><div><strong>{copy.file}</strong><small>PDF · Docneo</small></div><CheckIcon className="size-4 text-emerald-600" /></div><div className="file-row muted"><DocumentIcon className="size-6" /><div><i /><small>PDF</small></div></div></div>
        </div>
      </div>
      <span className="drive-approved"><CheckIcon className="size-4" />OK</span>
    </div>
  );
}

function Footer({ locale, copy }: { locale: Locale; copy: Dictionary }) {
  return (
    <footer className="site-footer">
      <div className="page-container grid gap-10 py-14 md:grid-cols-[1.4fr_.8fr_.8fr]">
        <div><Logo locale={locale} /><p className="mt-4 max-w-xs text-sm leading-6 text-slate-500">{copy.footer.tagline}</p><p className="mt-4 max-w-md text-xs leading-5 text-slate-400">{copy.footer.notice}</p></div>
        <div className="footer-links"><strong>{copy.footer.product}</strong><a href="#how">{copy.footer.features}</a><a href="#pricing">{copy.footer.pricing}</a><Link href={`/${locale}/login`}>{copy.footer.login}</Link></div>
        <div className="footer-links"><strong>{copy.footer.company}</strong><Link href={`/${locale}/privacy`}>{copy.footer.privacy}</Link><Link href={`/${locale}/terms`}>{copy.footer.terms}</Link><Link href={`/${locale}/imprint`}>{copy.footer.imprint}</Link><Link href={`/${locale}/contact`}>{copy.footer.contact}</Link></div>
      </div>
      <div className="page-container flex flex-col gap-3 border-t border-slate-200 py-6 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between"><span>{copy.footer.copyright}</span><span>Scan. Organize. Done.</span></div>
    </footer>
  );
}
