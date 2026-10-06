/**
 * Read-only data cache — Africa-first reliability.
 *
 * Purpose: when connectivity drops, the user still sees their last-known
 * balances and activity, clearly labeled as cached. Cached data is NEVER
 * presented as current — the UI shows the saved timestamp alongside it.
 * Only safe read-only data is cached; tokens and credentials never come
 * near this store (they live in secure storage).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface CachedEnvelope<T> {
  value: T;
  cachedAt: string; // ISO timestamp
}

const KEY_PREFIX = 'nora.cache.';

export async function getCached<T>(key: string): Promise<CachedEnvelope<T> | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY_PREFIX + key);
    return raw ? (JSON.parse(raw) as CachedEnvelope<T>) : null;
  } catch {
    return null; // a broken cache must never break the app
  }
}

export async function setCached<T>(key: string, value: T): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY_PREFIX + key, JSON.stringify({ value, cachedAt: new Date().toISOString() } satisfies CachedEnvelope<T>));
  } catch {
    /* storage full or unavailable — cache is best-effort */
  }
}
