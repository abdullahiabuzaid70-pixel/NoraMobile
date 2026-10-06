/**
 * Analytics abstraction — no vendor hardcoded into feature code.
 * Sinks (console now; Amplitude/Sentry later) subscribe to the bus.
 */
export type AnalyticsEvent =
  | 'onboarding_started'
  | 'onboarding_completed'
  | 'login_started'
  | 'login_completed'
  | 'login_failed'
  | 'verification_started'
  | 'verification_completed'
  | 'send_started'
  | 'recipient_selected'
  | 'quote_generated'
  | 'transfer_reviewed'
  | 'authorization_started'
  | 'transfer_submitted'
  | 'transfer_completed'
  | 'transfer_failed'
  | 'funding_started'
  | 'withdrawal_started'
  | 'voice_started'
  | 'voice_intent_detected'
  | 'voice_permission_denied';

export type AnalyticsProps = Record<string, string | number | boolean | null | undefined>;

type Sink = (event: AnalyticsEvent, props?: AnalyticsProps) => void;

const sinks: Sink[] = [__DEV__ ? (e, p) => console.log(`[analytics] ${e}`, p ?? {}) : () => undefined];

export function addSink(sink: Sink): void { sinks.push(sink); }

export function track(event: AnalyticsEvent, props?: AnalyticsProps): void {
  for (const s of sinks) {
    try { s(event, props); } catch { /* a failing sink must never break the app */ }
  }
}

/**
 * Redact before analytics: never emit PINs, tokens, full account numbers,
 * or amounts tied to identity. Amounts are rounded into coarse buckets.
 */
export function amountBucket(amountMajor: number): string {
  if (amountMajor <= 0) return 'zero';
  if (amountMajor < 1000) return '<1k';
  if (amountMajor < 10000) return '1k-10k';
  if (amountMajor < 100000) return '10k-100k';
  return '100k+';
}
