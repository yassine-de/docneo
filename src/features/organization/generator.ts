import type { FolderNode, OnboardingAnswers, UsageKind } from "./types";

export const PENDING_FOLDER_ID = "pending_documents";
export const PENDING_FOLDER_NAME = "00_UNERLEDIGT";

const personalNames: Record<string, string> = {
  personal_documents: "Persönliche Dokumente", insurance: "Versicherungen", finance: "Finanzen",
  tax: "Steuern", contracts: "Verträge", health: "Gesundheit", other: "Sonstiges",
};
const prefixes = {
  de: { personal: "Privat", family: "Familie", properties: "Immobilien", vehicles: "Fahrzeuge", business: "Unternehmen" },
  fr: { personal: "Privé", family: "Famille", properties: "Biens", vehicles: "Véhicules", business: "Entreprise" },
} satisfies Record<"de" | "fr", Record<UsageKind, string>>;
const localized: Record<"de" | "fr", Record<string, string>> = {
  de: {},
  fr: { "Persönliche Dokumente": "Documents personnels", "Versicherungen": "Assurances", "Finanzen": "Finances", "Steuern": "Impôts", "Verträge": "Contrats", "Gesundheit": "Santé", "Sonstiges": "Autres", "Schule": "École", "Dokumente": "Documents", "Kaufunterlagen": "Documents d’achat", "Mietverträge": "Baux", "Nebenkosten": "Charges", "Rechnungen": "Factures", "Instandhaltung": "Entretien", "Fahrzeugdokumente": "Documents du véhicule", "Versicherung": "Assurance", "Wartung": "Entretien", "Reparaturen": "Réparations", "Buchhaltung": "Comptabilité", "Eingangsrechnungen": "Factures fournisseurs", "Ausgangsrechnungen": "Factures clients", "Kunden": "Clients", "Lieferanten": "Fournisseurs", "Personal": "Personnel" },
};

const slug = (value: string) => value.normalize("NFKD").replace(/[^a-zA-Z0-9]+/g, "_").replace(/^_|_$/g, "").toLowerCase().slice(0, 48) || "folder";

export function generateFolderStructure(answers: OnboardingAnswers, locale: "de" | "fr" = "de"): FolderNode[] {
  const nodes: FolderNode[] = [{ id: PENDING_FOLDER_ID, name: PENDING_FOLDER_NAME, parentId: null, category: "system", specialType: "pending_documents", creationStatus: "proposed", position: 0 }];
  const selected = answers.usage.length ? answers.usage : ["personal" as const];
  const add = (name: string, parentId: string | null, category: UsageKind, id: string, entityIndex?: number) => nodes.push({ id, name, parentId, category, entityIndex, creationStatus: "proposed", position: nodes.filter((node) => node.parentId === parentId).length });
  const translate = (name: string) => localized[locale][name] ?? name;
  selected.forEach((kind, index) => {
    const parentId = `category_${kind}`;
    add(`${String(index + 1).padStart(2, "0")}_${prefixes[locale][kind]}`, null, kind, parentId);
    if (kind === "personal") (answers.personalAreas.length ? answers.personalAreas : ["personal_documents", "contracts"]).forEach((area) => add(translate(personalNames[area] ?? area), parentId, kind, `${parentId}_${slug(area)}`));
    if (kind === "family") answers.children.forEach((child, childIndex) => {
      const childId = `${parentId}_child_${childIndex + 1}`;
      add(child.label?.trim() || `${locale === "de" ? "Kind" : "Enfant"} ${childIndex + 1}`, parentId, kind, childId, childIndex);
      [child.school && "Schule", "Dokumente", "Versicherungen", "Sonstiges"].filter(Boolean).forEach((name) => add(translate(String(name)), childId, kind, `${childId}_${slug(String(name))}`, childIndex));
    });
    if (kind === "properties") answers.properties.forEach((property, propertyIndex) => {
      const propertyId = `${parentId}_property_${propertyIndex + 1}`;
      add(property.label?.trim() || `${locale === "de" ? "Immobilie" : "Bien"} ${propertyIndex + 1}`, parentId, kind, propertyId, propertyIndex);
      const folders = ["Kaufunterlagen", property.usage === "rented" && "Mietverträge", "Nebenkosten", "Rechnungen", "Versicherungen", "Instandhaltung", "Steuern"].filter(Boolean);
      folders.forEach((name) => add(translate(String(name)), propertyId, kind, `${propertyId}_${slug(String(name))}`, propertyIndex));
    });
    if (kind === "vehicles") answers.vehicles.forEach((vehicle, vehicleIndex) => {
      const vehicleId = `${parentId}_vehicle_${vehicleIndex + 1}`;
      add(vehicle.label?.trim() || `${locale === "de" ? "Fahrzeug" : "Véhicule"} ${vehicleIndex + 1}`, parentId, kind, vehicleId, vehicleIndex);
      ["Fahrzeugdokumente", "Versicherung", "Wartung", "Reparaturen", "Rechnungen"].forEach((name) => add(translate(name), vehicleId, kind, `${vehicleId}_${slug(name)}`, vehicleIndex));
    });
    if (kind === "business") {
      const folders = ["Buchhaltung", "Eingangsrechnungen", "Ausgangsrechnungen", "Kunden", "Lieferanten", "Verträge", "Steuern", answers.business?.hasEmployees && "Personal"].filter(Boolean);
      folders.forEach((name) => add(translate(String(name)), parentId, kind, `${parentId}_${slug(String(name))}`));
    }
  });
  return nodes;
}

export function validateFolderStructure(nodes: FolderNode[]): string[] {
  const errors: string[] = [];
  const pending = nodes.filter((node) => node.specialType === "pending_documents");
  if (pending.length !== 1 || pending[0]?.id !== PENDING_FOLDER_ID || pending[0]?.name !== PENDING_FOLDER_NAME || pending[0]?.parentId !== null) errors.push("invalid_pending_folder");
  if (nodes.length > 120) errors.push("too_many_folders");
  const byId = new Map(nodes.map((node) => [node.id, node]));
  if (byId.size !== nodes.length) errors.push("duplicate_ids");
  for (const node of nodes) {
    if (!node.name.trim() || node.name.length > 120 || /[\\/:*?"<>|]/.test(node.name)) errors.push(`invalid_name:${node.id}`);
    if (node.parentId && !byId.has(node.parentId)) errors.push(`missing_parent:${node.id}`);
    const siblings = nodes.filter((item) => item.parentId === node.parentId && item.name.toLocaleLowerCase() === node.name.toLocaleLowerCase());
    if (siblings.length > 1) errors.push(`duplicate_sibling:${node.id}`);
    const seen = new Set([node.id]); let parent = node.parentId; let depth = 0;
    while (parent) { if (seen.has(parent)) { errors.push(`cycle:${node.id}`); break; } seen.add(parent); parent = byId.get(parent)?.parentId ?? null; if (++depth > 6) { errors.push(`excessive_depth:${node.id}`); break; } }
  }
  return [...new Set(errors)];
}
