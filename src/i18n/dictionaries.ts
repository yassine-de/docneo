import "server-only";

import type { Locale } from "./config";

const dictionaries = {
  de: () => import("./de.json").then((module) => module.default),
  fr: () => import("./fr.json").then((module) => module.default),
};

export type Dictionary = Awaited<ReturnType<(typeof dictionaries)["de"]>>;

export async function getDictionary(locale: Locale): Promise<Dictionary> {
  return dictionaries[locale]();
}
