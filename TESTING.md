# Testing NORA

## Unit + domain tests (run anywhere)
`npx vitest run` — 32 tests covering money (minor units, no float drift),
FX quotes, identity/NORA ID, KYC truth rules, and voice intent parsing
(injection inertness included). These run in CI-less environments too.

## E2E — Maestro (needs a device/emulator)
Flows live in `.maestro/`. Prerequisites:
1. The app running: `npx expo start` with Expo Go, or an EAS preview build
   (`npx eas build -p android --profile preview`) installed on a device.
2. Maestro installed: `curl -fsSL "https://get.maestro.mobile.dev" | sh`
3. Pilot backend reachable (flows hit the real API client).

Run all flows:
`maestro test .maestro/`

Flows:
- send-happy-path — voice draft prefills, review + PIN gates hold, receipt
  reflects backend status
- kyc-truth — Profile shows a truthful KYC state, never a fabricated badge
- activity-offline — Activity shows the computed (not decorative) summary

Note: flows were authored against the pilot UI and are expected to need
one selector pass once run against a real device for the first time.
