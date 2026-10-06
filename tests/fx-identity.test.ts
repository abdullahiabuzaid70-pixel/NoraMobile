import { describe, expect, it } from 'vitest';
import { FxQuote, isUsable, quoteFromBackend, quoteStatus, senderPays } from '../src/domain/fx';
import { money } from '../src/domain/money';
import { countryOf, isValidNoraId, normalizeForLookup } from '../src/domain/identity';

const now = new Date('2026-10-06T10:00:00Z');

const quote = (expiresAt?: string): FxQuote => ({
  id: 'q_1',
  sourceAmount: money(500_00, 'NGN'),
  destAmount: money(34_00, 'GHS'),
  rate: 0.068,
  fee: money(50, 'NGN'),
  quotedAt: '2026-10-06T09:59:00Z',
  expiresAt,
});

describe('FX quotes', () => {
  it('marks quotes without expiry as estimates', () => {
    expect(quoteStatus(quote())).toBe('ESTIMATED');
  });

  it('expires quotes past their timestamp — never shown as current', () => {
    expect(quoteStatus(quote('2026-10-06T10:00:01Z'), now)).toBe('QUOTED');
    expect(quoteStatus(quote('2026-10-06T09:59:59Z'), now)).toBe('EXPIRED');
    expect(isUsable(quote('2026-10-06T09:59:59Z'), now)).toBe(false);
  });

  it('computes what the sender pays including fees', () => {
    expect(senderPays(quote('2026-10-06T10:05:00Z')).amountMinor).toBe(50050);
    expect(() => senderPays({ ...quote(), fee: money(50, 'GHS') })).toThrow();
  });
});

describe('NORA ID', () => {
  it('accepts the canonical format and nothing with separators', () => {
    expect(isValidNoraId('NG5366365355AA')).toBe(true);
    expect(isValidNoraId('NG-53663-65355AA')).toBe(false);
    expect(isValidNoraId('NG.5366365355AA')).toBe(false);
    expect(isValidNoraId('NG 5366365355AA')).toBe(false);
    expect(isValidNoraId('NG5366365355A')).toBe(true);
    expect(isValidNoraId('5366365355AA')).toBe(false);
  });

  it('normalizes user-typed separators for lookup only', () => {
    expect(normalizeForLookup('ng-53663-65355aa')).toBe('NG5366365355AA');
    expect(normalizeForLookup(' NG.53663 65355AA ')).toBe('NG5366365355AA');
  });

  it('extracts the country for network routing', () => {
    expect(countryOf('NG5366365355AA')).toBe('NG');
    expect(countryOf('GH5366365355AA')).toBe('GH');
    expect(countryOf('ZZ5366365355AA')).toBeNull();
  });
});

describe('quoteFromBackend adapter', () => {
  it('maps the loose backend shape into the domain quote', () => {
    const q = quoteFromBackend(
      { id: 'q_9', rate: 0.068, fee: 0.5, amount: 500, receive_amount: 34, recipient_currency: 'GHS', expires_at: '2026-10-06T10:10:00Z' },
      'NGN',
    );
    expect(q).not.toBeNull();
    expect(q!.sourceAmount).toEqual({ amountMinor: 50000, currency: 'NGN' });
    expect(q!.destAmount).toEqual({ amountMinor: 3400, currency: 'GHS' });
    expect(q!.fee.amountMinor).toBe(50);
    expect(isUsable(q!, now)).toBe(true);
  });

  it('derives the destination amount in integers when the backend omits it', () => {
    const q = quoteFromBackend({ quote_id: 'q_10', rate: 0.068, amount: 1000, recipient_currency: 'GHS' }, 'NGN');
    expect(q!.destAmount).toEqual({ amountMinor: 6800, currency: 'GHS' });
  });

  it('rejects unusable payloads instead of inventing a quote', () => {
    expect(quoteFromBackend(null, 'NGN')).toBeNull();
    expect(quoteFromBackend({}, 'NGN')).toBeNull();
    expect(quoteFromBackend({ rate: 0.068 }, 'NGN')).toBeNull(); // no id — never fabricate
  });
});
