import test from "node:test";
import assert from "node:assert/strict";
import { generateFolderStructure, PENDING_FOLDER_ID, PENDING_FOLDER_NAME, validateFolderStructure } from "../src/features/organization/generator";
import type { OnboardingAnswers } from "../src/features/organization/types";

const base: OnboardingAnswers = { usage: [], personalAreas: [], children: [], properties: [], vehicles: [] };

test("minimal and skipped onboarding always includes exactly one protected pending folder", () => {
  const nodes = generateFolderStructure(base);
  const pending = nodes.filter((node) => node.specialType === "pending_documents");
  assert.equal(pending.length, 1);
  assert.deepEqual(pending[0], { id: PENDING_FOLDER_ID, name: PENDING_FOLDER_NAME, parentId: null, category: "system", specialType: "pending_documents", creationStatus: "proposed", position: 0 });
  assert.deepEqual(validateFolderStructure(nodes), []);
});

test("generator adapts to family, rental property, vehicle and business answers", () => {
  const nodes = generateFolderStructure({ usage: ["family", "properties", "vehicles", "business"], personalAreas: [], children: [{ label: "Kind 1", school: false }, { label: "Mia", school: true }], properties: [{ usage: "rented" }, { label: "Eigenheim", usage: "owner_occupied" }], vehicles: [{}], business: { type: "freelancer", hasEmployees: false } });
  assert.ok(nodes.some((node) => node.name === "Mietverträge"));
  assert.equal(nodes.filter((node) => node.name === "Schule").length, 1);
  assert.equal(nodes.some((node) => node.name === "Personal"), false);
  assert.equal(nodes.filter((node) => node.name === PENDING_FOLDER_NAME).length, 1);
  assert.deepEqual(validateFolderStructure(nodes), []);
});

test("top-level numbering is sequential and French UI generates localized categories", () => {
  const nodes = generateFolderStructure({ ...base, usage: ["personal", "vehicles"] }, "fr");
  assert.ok(nodes.some((node) => node.name === "01_Privé"));
  assert.ok(nodes.some((node) => node.name === "02_Véhicules"));
});

test("editor validation rejects pending folder changes, cycles and duplicate siblings", () => {
  const nodes = generateFolderStructure({ ...base, usage: ["personal"] });
  assert.ok(validateFolderStructure(nodes.map((node) => node.id === PENDING_FOLDER_ID ? { ...node, name: "Pending" } : node)).includes("invalid_pending_folder"));
  const firstChild = nodes.find((node) => node.parentId === "category_personal")!;
  assert.ok(validateFolderStructure([...nodes, { ...firstChild, id: "duplicate" }]).some((error) => error.startsWith("duplicate_sibling")));
  assert.ok(validateFolderStructure(nodes.map((node) => node.id === "category_personal" ? { ...node, parentId: firstChild.id } : node)).some((error) => error.startsWith("cycle")));
});
