/**
 * NORA Money domain.
 *
 * RULES:
 * - JavaScript floats are NEVER the authoritative representation of money.
 * - The canonical value is `amountMinor` (integer minor units) + ISO-4217 code.
 * - All arithmetic happens on integers. Formatting is centralized here.
 * - Screens never hardcode currency symbols.
 */

export type CurrencyCode = 'NGN' | 'GHS' | 'KES' | 'ZAR' | 'USD' | 'EUR' | 'GBP';

export interface Money {
  readonly amountMinor: number;
  readonly currency: string;
}

/** Minor-unit exponent per ISO-4217 (0 for zero-decimal currencies). */
const EXPONENTS: Record<string, number> = { NGN: 2, GHS: 2, KES: 2, ZAR: 2, USD: 2, EUR: 2, GBP: 2, JPY: 0, BIF: 0 };

export const exponentOf = (currency: string): number => EXPONENTS[currency] ?? 2;

/** Construct Money safely from a major-unit float (UI input edge only). */
export function fromMajorFloat(value: number, currency: string): Money {
  if (!Number.isFinite(value)) throw new Error('Invalid amount');
  const exp = exponentOf(currency);
  const scale = 10 ** exp;
  const amountMinor = Math.round(value * scale);
  return { amountMinor, currency };
}

/** Parse a user-typed decimal string into Money. Returns null if invalid. */
export function fromUserInput(text: string, currency: string): Money | null {
  const cleaned = text.trim().replace(/,/g, '');
  if (!/^\d+(\.\d{1,4})?$/.test(cleaned)) return null;
  return fromMajorFloat(parseFloat(cleaned), currency);
}

export const money = (amountMinor: number, currency: string): Money => ({ amountMinor, currency });

export const add = (a: Money, b: Money): Money => {
  assertSameCurrency(a, b);
  return { amountMinor: a.amountMinor + b.amountMinor, currency: a.currency };
};

export const sub = (a: Money, b: Money): Money => {
  assertSameCurrency(a, b);
  return { amountMinor: a.amountMinor - b.amountMinor, currency: a.currency };
};

/** Proportional split of an integer by ratio (0..1), remainder to first part. Deterministic. */
export function allocate(amount: Money, ratio: number): { part: Money; rest: Money } {
  const partMinor = Math.round(amount.amountMinor * ratio);
  return { part: { amountMinor: partMinor, currency: amount.currency }, rest: { amountMinor: amount.amountMinor - partMinor, currency: amount.currency } };
}

export const isZero = (m: Money): boolean => m.amountMinor === 0;
export const isNegative = (m: Money): boolean => m.amountMinor < 0;
export const compare = (a: Money, b: Money): number => {
  assertSameCurrency(a, b);
  return a.amountMinor - b.amountMinor;
};

function assertSameCurrency(a: Money, b: Money): void {
  if (a.currency !== b.currency) throw new Error(`Currency mismatch: ${a.currency} vs ${b.currency}`);
}

// ── Formatting ───────────────────────────────────────────────────────

const SYMBOLS: Record<string, string> = { NGN: '₦', GHS: '₵', KES: 'KSh ', ZAR: 'R', USD: '$', EUR: '€', GBP: '£' };

export function symbolOf(currency: string): string {
  return SYMBOLS[currency] ?? '';
}

/** Format for display: symbol + grouped integer with correct decimals. */
export function format(m: Money, opts?: { hideSymbol?: boolean }): string {
  const { amountMinor, currency } = m;
  const exp = exponentOf(currency);
  const scale = 10 ** exp;
  const abs = Math.abs(amountMinor);
  const units = Math.floor(abs / scale).toLocaleString('en-US');
  const frac = exp > 0 ? `.${String(abs % scale).padStart(exp, '0')}` : '';
  const sign = amountMinor < 0 ? '-' : '';
  const symbol = opts?.hideSymbol ? '' : symbolOf(currency);
  return `${sign}${symbol}${units}${frac}`;
}

/** Major-unit number (e.g. for API serialization). */
export function toMajorFloat(m: Money): number {
  return m.amountMinor / 10 ** exponentOf(m.currency);
}

/** Accept backend values that may arrive as floats or minor integers. */
export function fromBackendValue(value: number | string | undefined | null, currency: string): Money {
  if (value == null) return { amountMinor: 0, currency };
  const n = typeof value === 'string' ? parseFloat(value) : value;
  if (!Number.isFinite(n)) return { amountMinor: 0, currency };
  return fromMajorFloat(n, currency);
}
