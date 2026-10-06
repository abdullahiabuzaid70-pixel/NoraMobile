import { describe, expect, it } from 'vitest';
import {
  canTransition, isAuthoritativelyComplete, isTerminal, normalizeState, stateAllowsExecution, TransactionState,
} from '../src/domain/transactions';

describe('Transaction state machine', () => {
  it('follows the legal lifecycle', () => {
    expect(canTransition('DRAFT', 'QUOTED')).toBe(true);
    expect(canTransition('QUOTED', 'REVIEW')).toBe(true);
    expect(canTransition('REVIEW', 'AWAITING_CONFIRMATION')).toBe(true);
    expect(canTransition('AWAITING_CONFIRMATION', 'AUTHORIZING')).toBe(true);
    expect(canTransition('AUTHORIZING', 'SUBMITTED')).toBe(true);
    expect(canTransition('SUBMITTED', 'COMPLETED')).toBe(true);
  });

  it('never skips the authorization gate', () => {
    // No path jumps straight from understanding money to it moving.
    expect(canTransition('REVIEW', 'SUBMITTED')).toBe(false);
    expect(canTransition('QUOTED', 'PROCESSING')).toBe(false);
    expect(canTransition('DRAFT', 'COMPLETED')).toBe(false);
  });

  it('treats terminal states as final (except reversal)', () => {
    expect(isTerminal('COMPLETED')).toBe(true);
    expect(isTerminal('FAILED')).toBe(true);
    expect(isTerminal('CANCELLED')).toBe(true);
    expect(canTransition('COMPLETED', 'REVERSED')).toBe(true);
    expect(canTransition('FAILED', 'COMPLETED')).toBe(false);
  });

  it('normalizes backend status strings defensively', () => {
    expect(normalizeState('completed')).toBe('COMPLETED');
    expect(normalizeState('REVIEW')).toBe('REVIEW');
    // Unknown statuses fall back conservatively — never to a final state.
    expect(normalizeState('IN-REVIEW')).toBe('PROCESSING');
    expect(normalizeState('something_new')).toBe('PROCESSING'); // unknown → conservative
    expect(normalizeState(undefined)).toBe('PROCESSING');
  });

  it('only marks backend-confirmed completion as complete', () => {
    expect(isAuthoritativelyComplete('COMPLETED')).toBe(true);
    expect(isAuthoritativelyComplete('PROCESSING')).toBe(false);
    expect(isAuthoritativelyComplete('SUBMITTED')).toBe(false);
  });

  it('allows execution only in the AUTHORIZING state', () => {
    const states: TransactionState[] = ['DRAFT', 'QUOTED', 'REVIEW', 'AWAITING_CONFIRMATION', 'AUTHORIZING', 'SUBMITTED', 'PENDING', 'COMPLETED'];
    expect(states.filter(stateAllowsExecution)).toEqual(['AUTHORIZING']);
  });
});
