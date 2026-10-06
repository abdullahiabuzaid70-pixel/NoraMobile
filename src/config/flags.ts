/**
 * Feature flags — typed, centralized, backend-remote-config-ready.
 * Never hardcode rollout switches inside screens.
 */
export interface FeatureFlags {
  voice: boolean;              // NORA Voice UI (foundation only — off until voice UX ships)
  crossBorder: boolean;       // cross-border corridor (NG→GH pilot)
  nonNoraRecipients: boolean; // send to non-NORA bank accounts
  business: boolean;           // NORA Business
  biometrics: boolean;          // biometric unlock (needs native capability check at runtime)
  mockServices: boolean;        // dev: route services to mock implementations
}

/** Current defaults — eventually hydrated from backend remote config. */
export const FLAGS: FeatureFlags = {
  voice: false,
  crossBorder: true,
  nonNoraRecipients: false,
  business: false,
  biometrics: false,
  mockServices: false,
};
