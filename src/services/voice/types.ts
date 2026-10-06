/**
 * NORA Voice — FOUNDATION ONLY (per master spec §22-23).
 *
 * Architecture:
 *   USER SPEAKS → SPEECH RECOGNITION → INTENT UNDERSTANDING → STRUCTURED INTENT
 *   → VALIDATION → ACTION PREVIEW → EXPLICIT USER CONFIRMATION →
 *   AUTHENTICATION → AUTHORIZATION → EXECUTION
 *
 * §RULE: Intent ≠ Authorization. Voice is an interface, never an
 * authorization bypass. Services below are replaceable abstractions —
 * no provider is coupled into the app. The UI for voice ships later
 * (feature flag `voice`); this module establishes the boundaries now.
 */

// ── Session state machine ──────────────────────────────────────────

export type VoiceSessionState =
  | 'idle'
  | 'requesting_permission'
  | 'permission_denied'
  | 'listening'
  | 'processing'      // transcribing / understanding intent
  | 'previewing'      // structured intent built, awaiting EXPLICIT human confirmation
  | 'authorizing'     // human confirmed; authentication/authorization in flight
  | 'executing'
  | 'responding'      // speaking the response
  | 'error';

export const VOICE_TRANSITIONS: Record<VoiceSessionState, VoiceSessionState[]> = {
  idle: ['requesting_permission', 'listening', 'error'],
  requesting_permission: ['listening', 'permission_denied', 'error'],
  permission_denied: ['idle'], // user must change OS settings; deep-link to settings
  listening: ['processing', 'idle', 'error'],
  processing: ['responding', 'previewing', 'idle', 'error'],
  previewing: ['authorizing', 'idle', 'error'],        // ← human confirmation happens here
  authorizing: ['executing', 'error'],
  executing: ['responding', 'error'],
  responding: ['idle', 'listening', 'error'],
  error: ['idle'],
};

export function canVoiceTransition(from: VoiceSessionState, to: VoiceSessionState): boolean {
  return VOICE_TRANSITIONS[from].includes(to);
}

// ── Structured intents ───────────────────────────────────────────────

export type VoiceIntent =
  | { kind: 'GET_BALANCE'; currency?: string }
  | { kind: 'GET_RATE'; source: string; destination: string }
  | { kind: 'PREPARE_TRANSFER'; recipientNoraId?: string; amountMajor?: number; currency?: string }
  | { kind: 'QUERY_ACTIVITY'; filter?: string }
  | { kind: 'UNKNOWN'; transcript: string };

export type VoiceReadonlyAction =
  | { kind: 'PRESENT_BALANCE'; currency: string }
  | { kind: 'PRESENT_RATE'; source: string; destination: string };

export type VoicePrepareAction =
  | { kind: 'PREPARE_TRANSFER'; recipientNoraId: string; amountMajor: number; currency: string };

/** Readonly actions may execute without authorization. Money preparation may NOT. */
export function intentIsReadonly(intent: VoiceIntent): boolean {
  return intent.kind === 'GET_BALANCE' || intent.kind === 'GET_RATE' || intent.kind === 'QUERY_ACTIVITY';
}

// ── Service interfaces (provider-replaceable) ────────────────────────

export interface VoicePermissionService {
  /** 'granted' | 'denied' | 'not-determined' | 'unavailable' */
  getStatus(): Promise<'granted' | 'denied' | 'not_determined' | 'unavailable'>;
  request(): Promise<'granted' | 'denied'>;
  /** Opens the OS app settings page when permission is permanently denied. */
  openSettings(): Promise<void>;
}

export interface SpeechRecognitionService {
  /** Starts a listening session; resolves with the final transcript. */
  listen(opts: { language: string; onPartial?: (text: string) => void }): Promise<string>;
  stop(): Promise<void>;
}

export interface IntentService {
  /** Transcript → structured intent. Backend-implemented (Gemini) in production. */
  understand(transcript: string, context: VoiceContext): Promise<VoiceIntent>;
}

export interface VoiceContext {
  userCurrency: string;
  supportedCurrencies: string[];
}

/** Preview hook — builds a human-readable action card for EXPLICIT confirmation. */
export interface VoiceActionService {
  /** Readonly intents may run directly. Prepare intents produce a preview — never execute. */
  buildAction(intent: VoiceIntent): Promise<VoiceReadonlyAction | VoicePrepareAction | null>;
}

/** Authorization hook — bridges to the same PIN/authorization path as the UI. */
export interface AuthorizationService {
  /** Returns true only after explicit human authorization (PIN / biometric). */
  requestAuthorization(preview: VoicePrepareAction): Promise<boolean>;
}

/** Noop dev implementation — foundation compiles & typechecks without a provider. */
export class NoopVoiceServices {
  permission: VoicePermissionService = {
    async getStatus() { return 'unavailable'; },
    async request() { return 'denied'; },
    async openSettings() {},
  };
  speech: SpeechRecognitionService = {
    async listen() { throw new Error('Voice recognition not available in this build'); },
    async stop() {},
  };
  intents: IntentService = {
    async understand(transcript) { return { kind: 'UNKNOWN', transcript }; },
  };
  actions: VoiceActionService = {
    async buildAction() { return null; },
  };
}
