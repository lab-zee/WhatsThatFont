const WEIGHT_SUFFIXES: RegExp[] = [
  /\s+Regular$/i,
  /\s+Book$/i,
  /\s+Normal$/i,
  /\s+Std$/i,
  /\s+Pro$/i,
  /\s+LT$/i,
];

/**
 * Normalizes a font name for catalog matching. Preserves the canonical casing
 * where possible — we match case-insensitively but surface the user-facing name
 * unchanged where we can.
 *
 * Strips:
 * - surrounding whitespace
 * - collapsed internal whitespace
 * - obvious weight suffixes ("Regular", "Book", "Std", etc.) that refer to a
 *   specific cut rather than the family itself.
 */
export function normalizeFontName(raw: string): string {
  let s = raw.trim().replace(/\s+/g, " ");
  for (const re of WEIGHT_SUFFIXES) {
    s = s.replace(re, "");
  }
  return s;
}

export function matchKey(name: string): string {
  return normalizeFontName(name).toLowerCase();
}
