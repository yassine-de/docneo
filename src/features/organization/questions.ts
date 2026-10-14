import type { Locale } from "@/i18n/config";
import type { UsageKind } from "./types";

export const usageOptions: Record<Locale, { value: UsageKind; label: string }[]> = {
  de: [{ value: "personal", label: "Privat" }, { value: "family", label: "Familie" }, { value: "properties", label: "Immobilien" }, { value: "vehicles", label: "Fahrzeuge" }, { value: "business", label: "Selbstständigkeit / Unternehmen" }],
  fr: [{ value: "personal", label: "Privé" }, { value: "family", label: "Famille" }, { value: "properties", label: "Biens immobiliers" }, { value: "vehicles", label: "Véhicules" }, { value: "business", label: "Indépendant / entreprise" }],
};

export const personalOptions: Record<Locale, { value: string; label: string }[]> = {
  de: [{ value: "personal_documents", label: "Persönliche Dokumente" }, { value: "insurance", label: "Versicherungen" }, { value: "finance", label: "Finanzen" }, { value: "tax", label: "Steuern" }, { value: "contracts", label: "Verträge" }, { value: "health", label: "Gesundheit" }, { value: "other", label: "Sonstiges" }],
  fr: [{ value: "personal_documents", label: "Documents personnels" }, { value: "insurance", label: "Assurances" }, { value: "finance", label: "Finances" }, { value: "tax", label: "Impôts" }, { value: "contracts", label: "Contrats" }, { value: "health", label: "Santé" }, { value: "other", label: "Autres" }],
};
