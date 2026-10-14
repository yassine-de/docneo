import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const load = async (locale) => JSON.parse(await readFile(new URL(`../src/i18n/${locale}.json`, import.meta.url), "utf8"));

function shape(value) {
  if (Array.isArray(value)) return [value.length ? shape(value[0]) : null];
  if (value && typeof value === "object") return Object.fromEntries(Object.keys(value).sort().map((key) => [key, shape(value[key])]));
  return typeof value;
}

test("German and French dictionaries have the same contract", async () => {
  const [de, fr] = await Promise.all([load("de"), load("fr")]);
  assert.deepEqual(shape(fr), shape(de));
});

test("landing content covers required commercial sections", async () => {
  for (const locale of ["de", "fr"]) {
    const copy = await load(locale);
    assert.equal(copy.audiences.items.length, 3);
    assert.equal(copy.pricing.plans.length, 4);
    assert.ok(copy.faq.items.length >= 7);
    assert.match(copy.demo.description, /demo|démo/i);
    assert.match(copy.drive.note, /nicht verbunden|non connectée/i);
    assert.match(copy.pricing.description, /vorläufig|provisoire/i);
  }
});

test("CTA language does not promise an unconfigured free trial", async () => {
  for (const locale of ["de", "fr"]) {
    const copy = await load(locale);
    assert.doesNotMatch(copy.hero.primary, /kostenlos|gratuitement/i);
  }
});
