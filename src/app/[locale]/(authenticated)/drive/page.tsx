import { notFound } from "next/navigation";
import Link from "next/link";
import { createRootFolderAction, disconnectDriveAction } from "@/features/drive/actions";
import { getDriveConnection } from "@/features/drive/repository";
import { requireUser } from "@/features/auth/session";
import { phase4Copy } from "@/features/organization/copy";
import { isLocale } from "@/i18n/config";

export default async function DrivePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params; if (!isLocale(locale)) notFound();
  const user = await requireUser(locale); const connection = await getDriveConnection(user.id); const copy = phase4Copy[locale].drive;
  const connected = connection?.status === "active";
  const reconnectRequired = connection?.status === "reconnect_required";
  return <section className="app-page"><div className="app-heading"><div><p className="eyebrow">{copy.eyebrow}</p><h1>{copy.title}</h1><p>{connected ? copy.connected : copy.disconnected}</p></div></div>
    {!connected && <article className={`app-card drive-connect-card${reconnectRequired ? " danger-card" : ""}`}><span className="card-icon">△</span><h2>{reconnectRequired ? copy.reconnect : copy.connect}</h2><p>{reconnectRequired ? copy.reconnectRequired : copy.disconnected}</p>{reconnectRequired && <p>{copy.reconnectHelp}</p>}<Link className="button button-primary" href={`/${locale}/drive/connect?mode=connect`}>{reconnectRequired ? copy.reconnect : copy.connect}</Link></article>}
    {connected && <div className="dashboard-grid drive-grid"><article className="app-card"><span className="connection-pill">● {copy.connected}</span><dl className="drive-details"><div><dt>{copy.account}</dt><dd>{connection.provider_email ?? user.email}</dd></div><div><dt>{copy.root}</dt><dd>{connection.root_folder_name ?? copy.missingRoot}</dd></div><div><dt>{copy.setup}</dt><dd>{connection.setup_status}</dd></div></dl><div className="drive-actions"><Link className="button button-primary" href={`/${locale}/drive/connect?mode=select`}>{copy.selectRoot}</Link><Link className="button button-secondary" href={`/${locale}/drive/connect?mode=connect`}>{copy.reconnect}</Link>{connection.root_folder_id && <Link className="button button-secondary" href={`/${locale}/organisation`}>{copy.manage}</Link>}</div></article><article className="app-card"><h2>{copy.createRoot}</h2><p>{locale === "de" ? "Dieser Vorgang erstellt nach deiner Bestätigung genau einen neuen Ordner in Mein Drive." : "Après confirmation, cette opération crée exactement un dossier dans Mon Drive."}</p><form className="root-folder-form" action={createRootFolderAction}><input type="hidden" name="locale" value={locale} /><label>{copy.root}<input name="folderName" defaultValue="Docneo" minLength={1} maxLength={120} required /></label><label className="auth-check"><input name="confirm" type="checkbox" value="yes" required />{locale === "de" ? "Ich bestätige die Erstellung dieses Ordners." : "Je confirme la création de ce dossier."}</label><button className="button button-primary" type="submit">{copy.createRoot}</button></form></article><article className="app-card danger-card"><h2>{copy.disconnect}</h2><p>{locale === "de" ? "Die Verbindung wird bei Google widerrufen. Drive-Dateien werden nicht gelöscht." : "L’autorisation Google sera révoquée. Aucun fichier Drive ne sera supprimé."}</p><form action={disconnectDriveAction}><input type="hidden" name="locale" value={locale} /><button className="button button-secondary" type="submit">{copy.disconnect}</button></form></article></div>}
  </section>;
}
