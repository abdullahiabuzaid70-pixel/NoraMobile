/**
 * useServerQuery — focused server-state hook for read-only financial data.
 *
 * Behaviors (§8 Home UX / §37 Africa-first reliability):
 * - Shows cached data immediately while revalidating (progressive render).
 * - Distinguishes a fresh fetch from a cached read (cachedAt / offline flag).
 * - Pull-to-refresh via `refresh`; never mutates data client-side.
 * - Timeouts on reads are safe to retry — money movement never goes through
 *   this hook (that path requires idempotency keys + explicit authorization).
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { getCached, setCached } from '../services/storage/cache';

export interface ServerQueryResult<T> {
  data: T | null;
  loading: boolean;      // first-ever load with nothing to show
  refreshing: boolean;   // pull-to-refresh in flight
  error: string;
  offline: boolean;      // network unreachable — showing cached data
  cachedAt: string | null;
  refresh: () => Promise<void>;
}

export function useServerQuery<T>(key: string, fetcher: () => Promise<T>): ServerQueryResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [offline, setOffline] = useState(false);
  const [cachedAt, setCachedAt] = useState<string | null>(null);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const load = useCallback(async (mode: 'initial' | 'refresh') => {
    if (mode === 'refresh') setRefreshing(true);
    try {
      const fresh = await fetcherRef.current();
      setData(fresh);
      setError('');
      setOffline(false);
      setCachedAt(null);
      await setCached(key, fresh);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Something went wrong';
      // On failure, fall back to cache rather than an empty screen — but label it.
      const cached = await getCached<T>(key);
      if (cached) {
        setData(cached.value);
        setCachedAt(cached.cachedAt);
        setOffline(true);
        setError('');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [key]);

  useEffect(() => {
    // Progressive render: paint cached data instantly, then revalidate.
    (async () => {
      const cached = await getCached<T>(key);
      if (cached) {
        setData(cached.value);
        setCachedAt(cached.cachedAt);
        setLoading(false);
      }
      await load('initial');
    })();
  }, [load]);

  return { data, loading, refreshing, error, offline, cachedAt, refresh: () => load('refresh') };
}
