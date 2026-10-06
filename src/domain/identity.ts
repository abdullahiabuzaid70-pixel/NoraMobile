/**
 * NORA ID — core identity primitive.
 *
 * CANONICAL FORMAT (locked): `NG5366365355AA`
 *   [2-letter country code][digits][optional letters] — NO hyphens, NO dots, NO spaces.
 *
 * RULES:
 * - The frontend displays the EXACT ID the authoritative backend returns.
 *   Never reformat, hyphenate, space, truncate, or "normalize for display".
 * - Input-side normalization (stripping separators a user typed) is allowed
 *   ONLY for resolving a lookup — the displayed value still comes from the backend.
 */

export interface NoraId {
  readonly value: string;
}

/** Country prefixes on the NORA network (data-driven; extend as corridors open). */
export const NORA_COUNTRIES: ReadonlyArray<{ code: string; name: string; currency: 'NGN' | 'GHS' | 'KES' }> = [
  { code: 'NG', name: 'Nigeria', currency: 'NGN' },
  { code: 'GH', name: 'Ghana', currency: 'GHS' },
  { code: 'KE', name: 'Kenya', currency: 'KES' },
];

/** Strip separators a user may type (NG-53663-65355AA → NG5366365355AA). Lookup input only. */
export function normalizeForLookup(input: string): string {
  return input.trim().toUpperCase().replace(/[\s.\-_]/g, '');
}

/** Structural validity check. Permissive on length; strict on shape and separators. */
export function isValidNoraId(value: string): boolean {
  const v = value.toUpperCase();
  return /^[A-Z]{2}[0-9]{6,14}[A-Z]{0,4}$/.test(v);
}

/** Country code of a NORA ID, if it matches a known country. */
export function countryOf(value: string): string | null {
  const cc = value.slice(0, 2).toUpperCase();
  return NORA_COUNTRIES.some((c) => c.code === cc) ? cc : null;
}

/** Display form: the backend value, verbatim. This is the ONLY display path. */
export function displayNoraId(backendValue: string): string {
  return backendValue; // deliberately identity — documented so nobody "improves" it
}
