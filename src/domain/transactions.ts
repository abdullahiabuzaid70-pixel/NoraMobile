/**
 * NORA transaction lifecycle.
 *
 * The authoritative backend determines real financial state. The frontend
 * REPRESENTS state — it never promotes state on its own (except transient
 * UI states like AUTHORIZING which the UI itself owns).
 */

export type TransactionState =
  | 'DRAFT'
  | 'QUOTED'
  | 'REVIEW'
  | 'AWAITING_CONFIRMATION'
  | 'AUTHORIZING'      // transient UI state while the authorization request is in flight
  | 'SUBMITTED'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'PENDING'
  | 'FAILED'
  | 'CANCELLED'
  | 'REVERSED';

export const TERMINAL_STATES: ReadonlySet<TransactionState> = new Set(['COMPLETED', 'FAILED', 'CANCELLED', 'REVERSED']);
export const SUCCESS_STATES: ReadonlySet<TransactionState> = new Set(['COMPLETED', 'PENDING', 'PROCESSING', 'SUBMITTED']);

/** Legal transitions of the lifecycle. UI states may be optimistic; backend states are authoritative. */
const TRANSITIONS: Record<TransactionState, TransactionState[]> = {
  DRAFT: ['QUOTED', 'CANCELLED', 'FAILED'],
  QUOTED: ['REVIEW', 'CANCELLED', 'FAILED'],
  REVIEW: ['AWAITING_CONFIRMATION', 'CANCELLED', 'FAILED'],
  AWAITING_CONFIRMATION: ['AUTHORIZING', 'CANCELLED', 'FAILED'],
  AUTHORIZING: ['SUBMITTED', 'FAILED', 'PENDING', 'PROCESSING'],
  SUBMITTED: ['PROCESSING', 'PENDING', 'COMPLETED', 'FAILED'],
  PROCESSING: ['COMPLETED', 'PENDING', 'FAILED', 'REVERSED'],
  PENDING: ['PROCESSING', 'COMPLETED', 'FAILED', 'REVERSED'],
  COMPLETED: ['REVERSED'],
  FAILED: [],
  CANCELLED: [],
  REVERSED: [],
};

export function canTransition(from: TransactionState, to: TransactionState): boolean {
  return TRANSITIONS[from].includes(to);
}

export const isTerminal = (s: TransactionState): boolean => TERMINAL_STATES.has(s);

/** Map any backend status string onto our canonical state (defensive — backends evolve). */
export function normalizeState(raw: string | undefined | null): TransactionState {
  const s = (raw || '').toUpperCase().replace(/[\s-]+/g, '_');
  const known: TransactionState[] = [
    'DRAFT', 'QUOTED', 'REVIEW', 'AWAITING_CONFIRMATION', 'AUTHORIZING', 'SUBMITTED',
    'PROCESSING', 'COMPLETED', 'PENDING', 'FAILED', 'CANCELLED', 'REVERSED',
  ];
  return (known as string[]).includes(s) ? (s as TransactionState) : 'PROCESSING';
}

/** True only when the authoritative backend has confirmed money landed. */
export function isAuthoritativelyComplete(state: TransactionState): boolean {
  return state === 'COMPLETED';
}

export interface TransactionRef {
  id: string;
  reference?: string;
  status: TransactionState;
}

/** §RULE: Intent ≠ Authorization. This helper documents which states may execute money. */
export function stateAllowsExecution(state: TransactionState): boolean {
  return state === 'AUTHORIZING'; // the only state where an authorized execution request may be in flight
}
