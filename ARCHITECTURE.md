# NORA Mobile — Architecture

NORA — Africa's Financial Network. "Move money across Africa like it's local."
React Native + Expo, iOS + Android, engineered for 10M+ users without a rewrite.

## Governing rules

1. **§RULE: Intent ≠ Authorization.** AI/voice/UX may understand and prepare a
   financial action, but money moves only after an explicit human confirmation
   (PIN) plus backend authorization. Voice is an interface, never an auth bypass.
2. **Backend is the single source of financial truth.** The frontend never
   fabricates balances, rates, or "Completed" states. Unknown outcomes are
   reported as unknown ("We're still confirming…"), never as success.
3. **No floats for money.** Canonical representation is `amountMinor: integer`
   + ISO-4217 code (`src/domain/money.ts`).
4. **Screens never hardcode colors, symbols, or endpoints.** Tokens live in
   `src/design-system/tokens.ts`, symbols in the money domain, endpoints in
   `src/services/api/noraClient.ts`.

## Layer map

```
UI (features/*)             screens + feature-local composition
  ↓
design-system/               locked tokens + shared styles + primitives (src/ui.tsx)
  ↓
services/                    the ONLY network boundary
  api/client.ts              timeouts, X-Request-ID, Idempotency-Key, typed errors
  api/noraClient.ts          typed endpoints (money movement REQUIRES idempotency key)
  storage/secure.ts          tokens in OS keychain/keystore (expo-secure-store)
  voice/types.ts             NORA Voice foundation (state machine + replaceable services)
  ↓
domain/                      pure, testable, no React, no network
  money.ts                   Money {amountMinor, currency} — integer arithmetic
  transactions.ts            state machine: DRAFT→…→COMPLETED (+FAILED/CANCELLED/REVERSED)
  fx.ts                      quotes with expiry: ESTIMATED/QUOTED/CONFIRMED/EXPIRED
  identity.ts                NORA ID: canonical format NG5366365355AA, no hyphens ever
  ↓
config/flags.ts              typed feature flags (backend remote-config ready)
analytics/analytics.ts       vendor-neutral event bus (no PII, coarse amount buckets)
navigation/                  react-navigation: auth gate → tabs → money-flow stack
```

## Key decisions

- **Navigation:** react-navigation (native-stack + bottom-tabs). Android back,
  deep links (`nora://`), state preservation, custom pixel-matched tab bar.
- **Auth:** `AuthProvider` restores sessions from secure storage on cold start;
  401s surface as `UNAUTHORIZED` for the gate. Logged-in ≠ authorized.
- **Idempotency:** every money-movement request carries an `Idempotency-Key`
  (crypto-random UUID). Timeouts on money requests report `outcomeUnknown`
  so the UI says "confirming", never "failed" (a retry could double-send).
- **Legacy facade:** `src/api.ts` keeps old screens compiling while delegating
  to the hardened client. Screens migrate feature-by-feature.
- **NORA Voice:** interfaces + session state machine only, behind feature
  flag `voice: false`. Provider-replaceable (see `services/voice/types.ts`).
- **Colors locked:** `#0A4D2C` primary, `#FDFBF7` cream, `#C9A961` gold,
  `#FFFFFF` surfaces. Derived tones exist only for accessibility/contrast.

## Financial safety invariants (tested)

- No state path skips AWAITING_CONFIRMATION → AUTHORIZING.
- Only `COMPLETED` (backend-confirmed) renders as complete.
- Unknown backend statuses normalize conservatively to PROCESSING.
- NORA IDs never gain hyphens/spaces; display uses the backend value verbatim.

## Testing

- `npm test` — vitest domain suite (money math, FX expiry, state machine, ID rules).
- `npm run typecheck` — strict TypeScript, zero errors.
- E2E (Detox/Maestro) and service contract tests come with Phase 20.

## Phase status (master build order)

- [x] Phase 0 — inspection, architecture, boundaries
- [x] Phase 1 — locked design tokens
- [x] Phase 2 — native navigation shell (auth gate + tabs + money-flow stack)
- [x] Phase 3 — auth foundation (secure sessions, restore, logout)
- [x] Foundation: domain (money/FX/transactions/ID), hardened API client,
      secure storage, voice interfaces, flags, analytics, tests
- [x] Phase 4 — Home hardening (skeletons, offline cache, pull-to-refresh)
- [x] Phase 7 — Send review step (full breakdown before PIN, quote expiry)
- [x] Phase 12/13 — truthful receipts (shared ReceiptView, shareable)
- [x] Phases 10/11 — Fund/Withdraw hardening (idempotency, outcome-unknown)
- [x] Phase 15 — Activity hardening (offline pattern, truthful in/out totals,
      fabricated trend metric removed)
- [x] Phase 22 — release engineering (EAS profiles: preview APK / production,
      CI workflow, RELEASE.md)
- [x] Phase 16 — KYC domain (tiers, truthful status from backend, per-tier
      limits; Profile shows real state, hardcoded 'Verified' removed)
- [x] Phase 17 — step-up: useStepUp hook (expo-local-authentication) detects
      biometric availability and surfaces it truthfully in Profile. Biometric
      SUBMIT is deliberately NOT wired into money movement: the backend
      contract only accepts a PIN, and faking a credential would violate the
      truth rule. Hook is ready once the backend supports device-credential
      authorization.
- [x] Phase 18 — NORA Voice domain (§1 Intent ≠ Authorization):
      parseVoiceIntent turns a transcript into a PREPARED draft only.
      Injection phrases are inert data ("send without pin" still yields a
      draft that requires the PIN). Missing fields are never invented.
      Send screen has a command box that PREFILLS the form — review step
      and PIN gate are architecturally unreachable from voice.
- [x] Phase 19 — E2E flows authored (Maestro, .maestro/): send happy path
      (voice prefill → review → PIN → backend-truthful receipt), KYC truth,
      Activity computed summary. Not yet executed — no emulator in the dev
      sandbox; first run against a real build needs one selector pass.
      TESTING.md documents how to run them.
- [ ] Phase 20 — mic capture (typed input is the honest pilot surface;
      real STT needs a native build + speech service)
