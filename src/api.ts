/**
 * Legacy facade — existing screens import `nora` from here.
 * Everything now delegates to the hardened client + typed endpoints.
 * Screens migrate to services/* over time; this keeps them compiling.
 */
import { request, setAuthToken, newIdempotencyKey } from './services/api/client';
import { authApi, accountApi, paymentsApi, User } from './services/api/noraClient';

export { ApiError } from './services/api/client';
export type { User } from './services/api/noraClient';

export const setToken = setAuthToken;

export const nora = {
  login: (country: 'NG' | 'GH', phone: string, pin: string) => authApi.login({ country, phone, pin }),
  register: (p: { firstName: string; lastName: string; country: 'NG' | 'GH'; phone: string; pin: string; noraId?: string; email?: string }) => authApi.register(p),
  me: () => accountApi.me(),
  resolveNoraId: (noraId: string) => accountApi.resolveNoraId(noraId),
  createQuote: (recipient: string, amount: number) => paymentsApi.createQuote({ recipient, amount }),
  /** §RULE: Intent ≠ Authorization. Idempotency key generated per attempt if not supplied. */
  authorizeTransfer: (quoteId: string, pin: string, idempotencyKey?: string) =>
    paymentsApi.authorizeTransfer({ quoteId, pin, idempotencyKey: idempotencyKey ?? newIdempotencyKey() }),
  fund: (p: { amount: number; source: string; pin: string }) =>
    paymentsApi.fund({ ...p, idempotencyKey: newIdempotencyKey() }),
  withdraw: (p: { amount: number; bankId: string; accountNumber: string; pin: string }) =>
    paymentsApi.withdraw({ ...p, idempotencyKey: newIdempotencyKey() }),
  banks: () => accountApi.banks(),
  activity: () => accountApi.activity(),
  balances: () => accountApi.balances(),
  fxRates: () => accountApi.fxRates(),
  health: () => request('/v1/health'),
};
