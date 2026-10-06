/**
 * useStepUp — biometric step-up with PIN always as fallback (§17).
 *
 * Face/fingerprint replaces TYPING the PIN when the device supports it,
 * but the PIN gate itself is never removed: biometric success maps to the
 * same explicit human authorization the PIN provides. §19 stands — no
 * auth method, no money moves.
 */
import { useCallback, useEffect, useState } from 'react';
import * as LocalAuthentication from 'expo-local-authentication';

export interface StepUp {
  available: boolean;    // hardware + enrolled biometrics exist
  kind: 'face' | 'fingerprint' | 'iris' | null;
  /** Runs the biometric prompt. Returns true only on authenticated success. */
  prompt: (reason: string) => Promise<boolean>;
}

export function useStepUp(): StepUp {
  const [available, setAvailable] = useState(false);
  const [kind, setKind] = useState<StepUp['kind']>(null);

  useEffect(() => {
    (async () => {
      try {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const enrolled = await LocalAuthentication.getEnrolledLevelAsync();
        const supported = await LocalAuthentication.supportedAuthenticationTypesAsync();
        if (hasHardware && enrolled > 0) {
          setAvailable(true);
          if (supported.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) setKind('face');
          else if (supported.includes(LocalAuthentication.AuthenticationType.IRIS)) setKind('iris');
          else if (supported.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) setKind('fingerprint');
        }
      } catch { /* unsupported device — PIN stays the gate */ }
    })();
  }, []);

  const prompt = useCallback(async (reason: string): Promise<boolean> => {
    try {
      const res = await LocalAuthentication.authenticateAsync({ promptMessage: reason, cancelLabel: 'Use PIN instead', disableDeviceFallback: false });
      return res.success;
    } catch {
      return false;
    }
  }, []);

  return { available, kind, prompt };
}
