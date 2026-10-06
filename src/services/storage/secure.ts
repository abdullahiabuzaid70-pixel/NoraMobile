/**
 * Secure storage boundary.
 *
 * Tokens and credentials NEVER live in plain AsyncStorage — they go to the
 * OS keystore/keychain via expo-secure-store. Higher-level keys are named
 * here so nothing scatters string literals through feature code.
 */
import * as SecureStore from 'expo-secure-store';

export const SECURE_KEYS = {
  accessToken: 'nora.auth.token',
  userId: 'nora.auth.userId',
} as const;

export async function secureSet(key: string, value: string): Promise<void> {
  await SecureStore.setItemAsync(key, value, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
}

export async function secureGet(key: string): Promise<string | null> {
  return SecureStore.getItemAsync(key);
}

export async function secureDelete(key: string): Promise<void> {
  await SecureStore.deleteItemAsync(key);
}

/** Clear every NORA credential — used by secure logout. */
export async function wipeCredentials(): Promise<void> {
  await Promise.all(Object.values(SECURE_KEYS).map((k) => secureDelete(k).catch(() => undefined)));
}
