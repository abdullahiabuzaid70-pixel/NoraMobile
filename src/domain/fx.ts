/**
 * NORA FX quote domain.
 *
 * FX is time-sensitive. A quote carries its own expiry; the UI must never
 * present an expired quote as current.
 */
import { Money, fromBackendValue } from './money';

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


/** Adapter: loosely-typed backend quote -> domain FxQuote. Defensive by design. */
export function quoteFromBackend(raw: Record<string, unknown> | null | undefined, sourceCurrency: string): FxQuote | null {
  if (!raw) return null;
  const id = (raw.quote_id ?? raw.id) as string | undefined;
  if (!id) return null;
  const srcCur = String(raw.source_currency ?? sourceCurrency ?? 'NGN');
  const dstCur = String(raw.recipient_currency ?? raw.destination_currency ?? srcCur);
  const rate = Number(raw.rate ?? 1);
  const source = fromBackendValue((raw.amount ?? raw.source_amount) as string | number, srcCur);
  const fee = fromBackendValue((raw.fee ?? raw.fee_amount) as string | number, srcCur);
  let dest = fromBackendValue((raw.receive_amount ?? raw.dest_amount) as string | number | null, dstCur);
  if ((raw.receive_amount ?? raw.dest_amount) == null && rate !== 1) {
    // Derive in integers; never multiply floats into display money.
    dest = { amountMinor: Math.round(source.amountMinor * rate), currency: dstCur };
  }
  return {
    id,
    sourceAmount: source,
    destAmount: dest,
    rate,
    fee,
    quotedAt: String(raw.quoted_at ?? new Date().toISOString()),
    expiresAt: (raw.expires_at ?? raw.expiresAt) as string | undefined,
  };
}
