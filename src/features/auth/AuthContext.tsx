/**
 * Authentication context — session lifecycle.
 *
 * Authentication ≠ Authorization (§19): being logged in only unlocks the
 * app shell; every money movement still requires explicit authorization
 * (PIN) at action time. Tokens live in the OS keychain/keystore.
 */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { setAuthToken } from '../../services/api/client';
import { authApi } from '../../services/api/noraClient';
import { SECURE_KEYS, secureGet, secureSet, wipeCredentials } from '../../services/storage/secure';
import { track } from '../../analytics/analytics';
import { User } from '../../services/api/noraClient';

type AuthStatus = 'restoring' | 'authenticated' | 'unauthenticated';

interface AuthSession { user: User; token: string }

interface AuthContextValue {
  status: AuthStatus;
  user: User | null;
  login: (country: 'NG' | 'GH', phone: string, pin: string) => Promise<void>;
  register: (p: { firstName: string; lastName: string; country: 'NG' | 'GH'; phone: string; pin: string; noraId?: string; email?: string }) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children, onSessionRestored }: { children: React.ReactNode; onSessionRestored?: (s: AuthSession | null) => void }) {
  const [status, setStatus] = useState<AuthStatus>('restoring');
  const [session, setSession] = useState<AuthSession | null>(null);

  // Restore persisted session on cold start (app restarts must not lose login).
  useEffect(() => {
    (async () => {
      try {
        const [token, userId] = await Promise.all([secureGet(SECURE_KEYS.accessToken), secureGet(SECURE_KEYS.userId)]);
        if (token && userId) {
          setAuthToken(token);
          const user = await authApi.me();
          const s = { user, token };
          setSession(s);
          setStatus('authenticated');
          onSessionRestored?.(s);
          return;
        }
      } catch {
        // Expired/invalid token — clear it and fall through to login.
        await wipeCredentials().catch(() => undefined);
        setAuthToken(null);
      }
      setStatus('unauthenticated');
      onSessionRestored?.(null);
    })();
  }, []);

  const login = useCallback(async (country: 'NG' | 'GH', phone: string, pin: string) => {
    track('login_started');
    const res = await authApi.login({ country, phone, pin });
    setAuthToken(res.token);
    await secureSet(SECURE_KEYS.accessToken, res.token);
    await secureSet(SECURE_KEYS.userId, res.user.id);
    setSession({ user: res.user, token: res.token });
    setStatus('authenticated');
    track('login_completed');
  }, []);

  const register = useCallback(async (p: Parameters<typeof authApi.register>[0]) => {
    track('onboarding_started');
    const res = await authApi.register(p);
    setAuthToken(res.token);
    await secureSet(SECURE_KEYS.accessToken, res.token);
    await secureSet(SECURE_KEYS.userId, res.user.id);
    setSession({ user: res.user, token: res.token });
    setStatus('authenticated');
    track('onboarding_completed');
  }, []);

  const logout = useCallback(async () => {
    setAuthToken(null);
    await wipeCredentials();
    setSession(null);
    setStatus('unauthenticated');
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    status,
    user: session?.user ?? null,
    login,
    register,
    logout,
  }), [status, session, login, register, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
