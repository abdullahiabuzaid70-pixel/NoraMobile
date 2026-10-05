/**
 * NORA mobile API client — talks to the same backend as the web app.
 * Backend: https://nora-sepia.vercel.app (Express on Vercel).
 * Rule: backend is the single source of truth. No invented balances.
 */
const API_BASE = 'https://nora-sepia.vercel.app';

export class ApiError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

let token: string | null = null;
export const setToken = (t: string | null) => { token = t; };
export const getToken = () => token;

async function request<T = any>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers || {}),
    },
  });
  let body: any = null;
  try { body = await res.json(); } catch { /* empty body */ }
  if (!res.ok) {
    throw new ApiError(body?.error?.code || `HTTP_${res.status}`, body?.error?.message || 'Request failed');
  }
  return body as T;
}

export const nora = {
  login: (country: 'NG' | 'GH', phone: string, pin: string) =>
    request<{ user: any; token: string }>('/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ country, phone, pin }),
    }),
  register: (p: { firstName: string; lastName: string; country: 'NG' | 'GH'; phone: string; pin: string; noraId?: string; email?: string }) =>
    request<{ user: any; token: string }>('/v1/auth/register', { method: 'POST', body: JSON.stringify(p) }),
  me: () => request('/v1/me'),
  resolveNoraId: (noraId: string) =>
    request(`/v1/resolve/${encodeURIComponent(noraId)}`),
  createQuote: (recipient: string, amount: number) =>
    request('/v1/quotes', { method: 'POST', body: JSON.stringify({ recipient, amount }) }),
  /** §RULE: Intent ≠ Authorization — the transfer executes only with the human's PIN. */
  authorizeTransfer: (quoteId: string, pin: string, idempotencyKey?: string) =>
    request('/v1/transfers', { method: 'POST', body: JSON.stringify({ quoteId, pin, idempotencyKey }) }),
  fund: (p: { amount: number; source: string; pin: string }) =>
    request('/v1/funding', { method: 'POST', body: JSON.stringify(p) }),
  withdraw: (p: { amount: number; bankId: string; accountNumber: string; pin: string }) =>
    request('/v1/withdrawals', { method: 'POST', body: JSON.stringify(p) }),
  banks: () => request('/v1/banks'),
  activity: () => request('/v1/activity'),
  balances: () => request('/v1/balances'),
  fxRates: () => request('/v1/fx/rates'),
  health: () => request('/v1/health'),
};
