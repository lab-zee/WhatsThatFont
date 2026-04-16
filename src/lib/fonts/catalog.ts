import { z } from "zod";
import catalogRaw from "./catalog.json";
import { matchKey } from "./normalize";

const LicenseSchema = z.enum([
  "ofl",
  "proprietary",
  "bundled-macos",
  "bundled-windows",
  "bundled-adobe-fonts",
]);
export type CuratedLicense = z.infer<typeof LicenseSchema>;

const CatalogEntrySchema = z.object({
  name: z.string().min(1),
  license: LicenseSchema,
  sourceUrl: z.url(),
  aliases: z.array(z.string().min(1)).optional(),
});
export type CatalogEntry = z.infer<typeof CatalogEntrySchema>;

const CatalogSchema = z.array(CatalogEntrySchema);

const catalog: readonly CatalogEntry[] = CatalogSchema.parse(catalogRaw);

const index: ReadonlyMap<string, CatalogEntry> = (() => {
  const m = new Map<string, CatalogEntry>();
  for (const entry of catalog) {
    m.set(matchKey(entry.name), entry);
    for (const alias of entry.aliases ?? []) {
      m.set(matchKey(alias), entry);
    }
  }
  return m;
})();

export function findCuratedFont(name: string): CatalogEntry | null {
  return index.get(matchKey(name)) ?? null;
}

export function listCuratedFonts(): readonly CatalogEntry[] {
  return catalog;
}
