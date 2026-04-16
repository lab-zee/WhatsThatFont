import googleFamiliesRaw from "./google-families.json";
import { matchKey } from "./normalize";

const families: readonly string[] = googleFamiliesRaw as string[];
const index: ReadonlyMap<string, string> = new Map(families.map((f) => [matchKey(f), f]));

export type GoogleFontMatch = {
  family: string;
  embedUrl: string;
  cssFamily: string;
};

/**
 * Returns the canonical Google Fonts family entry if `name` matches a known family,
 * otherwise null. Matching is done on the normalized key so "Inter Regular" resolves
 * to "Inter".
 */
export function findGoogleFont(name: string): GoogleFontMatch | null {
  const key = matchKey(name);
  const family = index.get(key);
  if (!family) return null;
  return {
    family,
    embedUrl: buildEmbedUrl(family),
    cssFamily: buildCssFamily(family),
  };
}

function buildEmbedUrl(family: string): string {
  const encoded = family.trim().replace(/\s+/g, "+");
  return `https://fonts.googleapis.com/css2?family=${encoded}&display=swap`;
}

function buildCssFamily(family: string): string {
  return `'${family}', sans-serif`;
}

export function listGoogleFamilies(): readonly string[] {
  return families;
}
