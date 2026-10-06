/** NORA shared app types. */
import { ApiError } from './api';

export type User = { nora_id?: string; first_name?: string; last_name?: string; country?: string; currency?: string; phone?: string; email?: string };
export type NavTarget = 'send' | 'activity' | 'accounts' | 'fund' | 'withdraw';

/** Human-readable error text. */
export const err = (e: unknown): string =>
  e instanceof ApiError ? e.message : 'Network error — check your connection and try again.';
