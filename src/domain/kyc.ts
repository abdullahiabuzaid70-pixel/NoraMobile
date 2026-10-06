/**
 * KYC domain — verification tiers, truthful status, per-tier limits.
 *
 * §2 truth rule: the client never decides verification. Status comes from
 * the backend; absence of data means NOT_STARTED, never APPROVED.
 * Limits are advisory display values the backend enforces — the client
 * blocks nothing (backend is the single source of truth), it only
 * explains what the user can expect per tier.
 */
import { Money } from './money';

export type KycStatus = 'NOT_STARTED' | 'PENDING' | 'APPROVED' | 'REJECTED';
export type KycTier = 'TIER_1' | 'TIER_2' | 'TIER_3';

export interface KycState {
  status: KycStatus;
  tier: KycTier;
  /** True only when the backend explicitly approved tier 2 or above. */
  fullyVerified: boolean;
}

/** Daily transfer limits per tier (pilot display values; backend enforces). */
export const TIER_LIMITS_NGN_MINOR: Record<KycTier, number> = {
  TIER_1: 5_000_000,     // ₦50,000/day — phone verified
  TIER_2: 50_000_000,    // ₦500,000/day — government ID
  TIER_3: 500_000_000,   // ₦5,000,000/day — address + income verified
};

export const TIER_LABELS: Record<KycTier, string> = {
  TIER_1: 'Tier 1 · Phone verified',
  TIER_2: 'Tier 2 · ID verified',
  TIER_3: 'Tier 3 · Fully verified',
};

/** Normalize any backend shape into a KycState — defaults are unverified. */
export function normalizeKyc(raw: Record<string, unknown> | null | undefined): KycState {
  const status = String(raw?.status ?? 'NOT_STARTED').toUpperCase() as KycStatus;
  const tier = String(raw?.tier ?? 'TIER_1').toUpperCase() as KycTier;
  return {
    status: (['NOT_STARTED', 'PENDING', 'APPROVED', 'REJECTED'] as const).includes(status as any) ? status : 'NOT_STARTED',
    tier: (['TIER_1', 'TIER_2', 'TIER_3'] as const).includes(tier as any) ? tier : 'TIER_1',
    fullyVerified: (status === 'APPROVED') && (tier === 'TIER_2' || tier === 'TIER_3'),
  };
}

export function dailyLimitFor(state: KycState): Money {
  return { amountMinor: TIER_LIMITS_NGN_MINOR[state.tier], currency: 'NGN' };
}

/** Advisory check for UI messaging only — the backend always re-checks. */
export function withinLimit(state: KycState, amountMinor: number): boolean {
  if (state.status !== 'APPROVED') return false;
  return amountMinor <= TIER_LIMITS_NGN_MINOR[state.tier];
}
