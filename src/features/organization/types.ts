export const usageKinds = ["personal", "family", "properties", "vehicles", "business"] as const;
export type UsageKind = (typeof usageKinds)[number];

export type PropertyUsage = "owner_occupied" | "rented";
export type BusinessType = "freelancer" | "sole_trader" | "company" | "other";

export type OnboardingAnswers = {
  usage: UsageKind[];
  personalAreas: string[];
  children: { label?: string; school: boolean }[];
  properties: { label?: string; usage: PropertyUsage }[];
  vehicles: { label?: string }[];
  business?: { type: BusinessType; label?: string; hasEmployees: boolean };
};

export type FolderNode = {
  id: string;
  name: string;
  parentId: string | null;
  category: UsageKind | "system";
  entityIndex?: number;
  specialType?: "pending_documents";
  creationStatus: "proposed" | "existing" | "created" | "failed";
  position: number;
};

export const emptyAnswers: OnboardingAnswers = {
  usage: [], personalAreas: [], children: [], properties: [], vehicles: [],
};
