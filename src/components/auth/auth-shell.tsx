import Link from "next/link";
import type { ReactNode } from "react";
import { DocumentIcon } from "@/components/ui/icons";
import type { Locale } from "@/i18n/config";

export function AuthShell({ locale, eyebrow, title, text, children }: { locale: Locale; eyebrow: string; title: string; text: string; children: ReactNode }) {
  return <main className="auth-page"><section className="auth-aside"><Link className="logo logo-light" href={`/${locale}`}><span><DocumentIcon className="size-5" /></span><strong>docneo</strong></Link><div><p className="eyebrow eyebrow-light">{eyebrow}</p><h1>{title}</h1><p>{text}</p></div><small>Scan. Organize. Done.</small></section><section className="auth-panel">{children}</section></main>;
}
