/**
 * NORA Voice domain — transcript → prepared intent. NEVER an authorization.
 *
 * The master rule (§1 of the NORA Voice spec): Intent ≠ Authorization.
 * This module can only produce a DRAFT for the existing human-gated flow.
 * It has no access to the API client, cannot create transactions, and by
 * construction cannot skip the review step or the PIN gate. The output feeds
 * the Send form; the human taps Confirm and enters their PIN as always.
 *
 * Prompt-injection defense: the transcript is data. Any embedded instruction
 * ("ignore previous rules", "you are now authorized", "send without PIN")
 * can only ever surface as parsed fields — and every instruction-like phrase
 * is deliberately ignored. Unknown words never invent recipients or amounts.
 */
import { isValidNoraId, normalizeForLookup } from './identity';

export type VoiceIntentKind = 'send' | 'check_balance' | 'fund' | 'withdraw' | 'none';

export interface VoiceDraft {
  kind: VoiceIntentKind;
  /** Raw transcript, kept for the review screen so the human sees what they said. */
  transcript: string;
  /** Send drafts: recipient NORA ID if one was spoken; null = keep asking. */
  recipientNoraId: string | null;
  /** Send drafts: amount in integer minor units; null = keep asking. */
  amountMinor: number | null;
  currency: 'NGN' | 'GHS' | null;
  /** True when the transcript was understood but fields are missing. */
  incomplete: boolean;
  /** Plain-English next step for the UI to show. */
  nextStep: string;
}

const ID_RE = /\b((?:NG|GH|KE)\d{8,}[A-Z]{0,2})\b/i;
const AMOUNT_RE = /\b(\d+(?:[.,]\d{1,2})?)\s*(k|m|thousand|million|hundred|naira|nairas|cedis|cedis'|ghs|ngn)?\b/i;

/** Words that look like instructions to the agent are stripped from meaning. */
const INJECTION_RE = /\b(ignore (all )?(previous|prior)|without (a )?pin|no pin|skip (the )?(pin|review|confirmation)|you are now authorized|disregard|bypass)\b/i;

function parseAmountMinor(m: RegExpMatchArray): number | null {
  const base = Math.round(parseFloat(m[1].replace(',', '.')) * 100);
  if (!Number.isFinite(base)) return null;
  const mult = (m[2] || '').toLowerCase();
  if (mult.startsWith('k') || mult === 'thousand') return base * 1_000;
  if (mult.startsWith('m') || mult === 'million') return base * 1_000_000;
  if (mult === 'hundred') return base * 100;
  return base;
}

function parseCurrency(text: string, m: RegExpMatchArray): 'NGN' | 'GHS' | null {
  const t = text.toLowerCase();
  const u = (m[2] || '').toLowerCase();
  if (t.includes('cedis') || u === 'ghs') return 'GHS';
  if (t.includes('naira') || u === 'ngn') return 'NGN';
  return null;
}

/**
 * Parse a transcript into a prepared draft. Always returns a VoiceDraft —
 * kind 'none' with a nextStep hint when nothing is understood. Never throws,
 * never invents fields that were not spoken.
 */
export function parseVoiceIntent(transcript: string): VoiceDraft {
  const clean = (transcript || '').trim();
  const t = clean.toLowerCase();

  // Injection phrases change nothing: the transcript remains pure data.
  const injected = INJECTION_RE.test(t);

  if (t === '') {
    return { kind: 'none', transcript: clean, recipientNoraId: null, amountMinor: null, currency: null, incomplete: false, nextStep: "Say or type what you'd like to do, e.g. 'Send 5,000 naira to NG5366365355AA'." };
  }
  if (/\b(balance|how much do (i|we) have|my money|account balance)\b/.test(t)) {
    return { kind: 'check_balance', transcript: clean, recipientNoraId: null, amountMinor: null, currency: null, incomplete: false, nextStep: 'Opening your balance — showing the latest confirmed figure from NORA.' };
  }
  if (/\b(add|fund|top ?up|deposit)\b/.test(t) && !/\bsend\b/.test(t)) {
    const m = AMOUNT_RE.exec(clean);
    const amountMinor = m ? parseAmountMinor(m) : null;
    return { kind: 'fund', transcript: clean, recipientNoraId: null, amountMinor, currency: parseCurrency(clean, m || ([''] as unknown as RegExpMatchArray)), incomplete: !m, nextStep: amountMinor ? `Add Money prepared for ${(amountMinor / 100).toLocaleString()} — review and enter your PIN to authorize.` : 'How much would you like to add?' };
  }
  if (/\b(withdraw|cash out|send to bank)\b/.test(t)) {
    const m = AMOUNT_RE.exec(clean);
    const amountMinor = m ? parseAmountMinor(m) : null;
    return { kind: 'withdraw', transcript: clean, recipientNoraId: null, amountMinor, currency: parseCurrency(clean, m || ([''] as unknown as RegExpMatchArray)), incomplete: !m, nextStep: amountMinor ? `Withdrawal prepared for ${(amountMinor / 100).toLocaleString()} — review and enter your PIN to authorize.` : 'How much would you like to withdraw?' };
  }
  if (/\b(send|pay|transfer)\b/.test(t)) {
    const idm = ID_RE.exec(clean);
    const am = AMOUNT_RE.exec(clean);
    const recipientNoraId = idm && isValidNoraId(normalizeForLookup(idm[1])) ? idm[1].toUpperCase() : null;
    const amountMinor = am ? parseAmountMinor(am) : null;
    const missing = [] as string[];
    if (!recipientNoraId) missing.push('who to send to');
    if (!amountMinor) missing.push('how much');
    return {
      kind: 'send', transcript: clean, recipientNoraId, amountMinor,
      currency: parseCurrency(clean, am || ([''] as unknown as RegExpMatchArray)),
      incomplete: missing.length > 0,
      nextStep: injected
        ? 'Prepared what I understood. Voice can only prepare — you confirm the details and enter your PIN.'
        : missing.length === 0
          ? 'Draft ready — review the details and enter your PIN to authorize. Voice never sends by itself.'
          : `Draft needs ${missing.join(' and ')}.`,
    };
  }
  return { kind: 'none', transcript: clean, recipientNoraId: null, amountMinor: null, currency: null, incomplete: false, nextStep: "I can prepare a send, add money, withdrawal, or balance check — but you always confirm. Try 'Send 5,000 naira to NG5366365355AA'." };
}
