/**
 * NORA FX quote domain.
 *
 * FX is time-sensitive. A quote carries its own expiry; the UI must never
 * present an expired quote as current.
 */
import { Money } from './money';

export type QuoteStatus = 'ESTIMATED' | 'QUOTED' | 'CONFIRMED' | 'EXPIRED';

export interface FxQuote {
  readonly id: string;
  readonly sourceAmount: Money;
  readonly destAmount: Money;
  /** Major-unit rate: 1 sourceCurrency = rate destCurrency. */
  readonly rate: number;
  readonly fee: Money;
  readonly quotedAt: string;      // ISO timestamp
  readonly expiresAt?: string;   // ISO timestamp — absent means indicative only
}

export function quoteStatus(q: FxQuote, now: Date = new Date()): QuoteStatus {
  if (!q.expiresAt) return 'ESTIMATED';
  return new Date(q.expiresAt).getTime() <= now.getTime() ? 'EXPIRED' : 'QUOTED';
}

export function isUsable(q: FxQuote, now: Date = new Date()): boolean {
  const status = quoteStatus(q, now);
  return status === 'QUOTED' || status === 'CONFIRMED';
}

/** Effective total the sender pays: source + fee (same currency enforced at construction). */
export function senderPays(q: FxQuote): Money {
  if (q.fee.currency !== q.sourceAmount.currency) throw new Error('Fee currency mismatch');
  return { amountMinor: q.sourceAmount.amountMinor + q.fee.amountMinor, currency: q.sourceAmount.currency };
}

export const QUOTE_LABELS: Record<QuoteStatus, string> = {
  ESTIMATED: 'Estimated',
  QUOTED: 'Quoted',
  CONFIRMED: 'Confirmed',
  EXPIRED: 'Expired',
};
