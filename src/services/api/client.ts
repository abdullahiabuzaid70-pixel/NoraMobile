/**
 * NORA API client — the single network boundary.
 *
 * All traffic goes through here: typed requests, auth header, per-request
 * IDs for correlation, idempotency keys for money movement, timeouts, and
 * standardized errors. Screens never call fetch directly.
 */
import * as Crypto from 'expo-crypto';

const API_BASE = 'https://nora-sepia.vercel.app';
const DEFAULT_TIMEOUT_MS = 15000;

export type ApiErrorCode =
  | 'OFFLINE'          // no connectivity
  | 'TIMEOUT'          // request exceeded its deadline (result UNKNOWN — never retry blindly)
  | 'UNAUTHORIZED'     // session invalid — auth flow must react
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'VALIDATION'
  | 'RATE_LIMITED'
  | 'SERVER'
  | 'NETWORK'
  | 'UNKNOWN';

export class ApiError extends Error {
  readonly code: ApiErrorCode;
  readonly status?: number;
  readonly requestId?: string;
  /** True when we do not know whether the action happened (timeouts on money movement). */
  readonly outcomeUnknown: boolean;

  constructor(code: ApiErrorCode, message: string, opts?: { status?: number; requestId?: string; outcomeUnknown?: boolean }) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = opts?.status;
    this.requestId = opts?.requestId;
    this.outcomeUnknown = opts?.outcomeUnknown ?? false;
  }
}

interface RequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  /** Attach an Idempotency-Key — REQUIRED for any request that moves or authorizes money. */
  idempotencyKey?: string;
  /** Marks the request as a money-movement so timeouts report `outcomeUnknown`. */
  moneyMovement?: boolean;
  timeoutMs?: number;
}

let accessToken: string | null = null;
export const setAuthToken = (token: string | null) => { accessToken = token; };
export const getAuthToken = () => accessToken;

export function newIdempotencyKey(): string {
  return Crypto.randomUUID();
}

function statusToCode(status: number): ApiErrorCode {
  if (status === 401) return 'UNAUTHORIZED';
  if (status === 403) return 'FORBIDDEN';
  if (status === 404) return 'NOT_FOUND';
  if (status === 400 || status === 422) return 'VALIDATION';
  if (status === 429) return 'RATE_LIMITED';
  return 'SERVER';
}

export async function request<T>(path: string, config: RequestConfig = {}): Promise<T> {
  const { method = 'GET', body, idempotencyKey, moneyMovement = false, timeoutMs = DEFAULT_TIMEOUT_MS } = config;
  const requestId = Crypto.randomUUID();

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-Request-ID': requestId,
        ...(idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {}),
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (e: unknown) {
    clearTimeout(timer);
    const aborted = e instanceof Error && e.name === 'AbortError';
    if (aborted) {
      throw new ApiError('TIMEOUT', 'The request took too long. Your connection may be unstable.', {
        requestId,
        outcomeUnknown: moneyMovement,
      });
    }
    throw new ApiError('OFFLINE', 'You appear to be offline. Check your connection and try again.', { requestId });
  }
  clearTimeout(timer);

  let payload: unknown = null;
  try { payload = await res.json(); } catch { /* empty body */ }

  if (!res.ok) {
    const errBody = (payload as { error?: { code?: string; message?: string } } | null)?.error;
    throw new ApiError(
      statusToCode(res.status),
      errBody?.message || `Request failed (${res.status})`,
      { status: res.status, requestId },
    );
  }
  return payload as T;
}
