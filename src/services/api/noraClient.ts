/**
 * NORA typed endpoints. The ONLY place endpoint paths are spelled out.
 * Money-movement calls REQUIRE an idempotency key — enforced by signature.
 */
import { request } from './client';

export interface User {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone: string;
  country: 'NG' | 'GH';
  currency: string;
  nora_id?: string;
  kyc_status?: string;
}

export interface Balance { currency: string; available?: number; balance?: number; available_balance?: number }
export interface Transaction {
  id: string;
  type?: string;
  description?: string;
  amount?: number;
  currency?: string;
  debit_amount?: number;
  credit_amount?: number;
  status?: string;
  reference?: string;
  country?: string;
  created_at?: string;
  direction?: string;
}
export interface Bank { id: string; name?: string; code?: string; last4?: string }
export interface Recipient {
  display_name?: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  nora_id?: string;
  country?: string;
}
export interface Quote {
  id?: string;
  quote_id?: string;
  rate?: number;
  fee?: number;
  fee_amount?: number;
  amount?: number;
  receive_amount?: number;
  recipient_currency?: string;
  expires_at?: string;
}

export const authApi = {
  me: () => request<User>('/v1/me'),
  login: (p: { country: 'NG' | 'GH'; phone: string; pin: string }) =>
    request<{ user: User; token: string }>('/v1/auth/login', { method: 'POST', body: p }),
  register: (p: { firstName: string; lastName: string; country: 'NG' | 'GH'; phone: string; pin: string; noraId?: string; email?: string }) =>
    request<{ user: User; token: string }>('/v1/auth/register', { method: 'POST', body: p }),
};

export const accountApi = {
  me: () => request<User>('/v1/me'),
  balances: () => request<Balance[] | { balances: Balance[] }>('/v1/balances'),
  activity: () => request<Transaction[] | { transactions: Transaction[] }>('/v1/activity'),
  banks: () => request<Bank[] | { banks: Bank[] }>('/v1/banks'),
  fxRates: () => request<unknown>('/v1/fx/rates'),
  kyc: () => request<Record<string, unknown>>('/v1/kyc'),
  resolveNoraId: (noraId: string) =>
    request<Recipient>(`/v1/resolve/${encodeURIComponent(noraId)}`),
};

export const paymentsApi = {
  createQuote: (p: { recipient: string; amount: number }) =>
    request<Quote>('/v1/quotes', { method: 'POST', body: p }),
  /** §RULE: Intent ≠ Authorization — executes ONLY with the human's PIN + idempotency key. */
  authorizeTransfer: (p: { quoteId: string; pin: string; idempotencyKey: string }) =>
    request<Transaction>('/v1/transfers', { method: 'POST', body: p, idempotencyKey: p.idempotencyKey, moneyMovement: true }),
  fund: (p: { amount: number; source: string; pin: string; idempotencyKey: string }) =>
    request<Transaction>('/v1/funding', { method: 'POST', body: p, idempotencyKey: p.idempotencyKey, moneyMovement: true }),
  withdraw: (p: { amount: number; bankId: string; accountNumber: string; pin: string; idempotencyKey: string }) =>
    request<Transaction>('/v1/withdrawals', { method: 'POST', body: p, idempotencyKey: p.idempotencyKey, moneyMovement: true }),
};
