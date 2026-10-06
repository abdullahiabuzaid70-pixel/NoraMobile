# NORA Mobile

NORA — Africa's Financial Network. React Native (Expo) app for iOS and Android.
Same product, same backend, same rules as the web app at https://nora-sepia.vercel.app.

## What's inside
- Auth: register + sign in (NG/GH, phone + PIN)
- Home: balances, FX rates, recent activity, quick actions
- Send: resolve NORA ID → live quote → PIN authorization → receipt
- Add Money: simulated bank funding (sandbox pilot)
- Withdraw: to bank, with PIN authorization
- Activity: full transaction history
- Profile: identity card, sign out

Architecture rule (same as web): **Intent ≠ Authorization.**
The AI/UI may prepare a payment, but money moves only after the human
enters their PIN and the backend authorizes it. No fake success states.

The API client (`src/api.ts`) talks to the live NORA backend:
`https://nora-sepia.vercel.app` (Express on Vercel).

## Design
Matches the official NORA brand reference screens exactly: light cream background,
dark-green (#0A2D22) cards for balance/tiles/promo banners, gold (#F0B429) accents,
real icon set (@expo/vector-icons / Ionicons) instead of emoji placeholders.

Home: logo header, bell + profile icons, verified-badge greeting, balance card with
eye-toggle, Active pill, copyable NORA ID, 3 icon-circle action tiles with subtitles,
light promo banner with gold "Explore Now" CTA, recent activity with icon avatars
and checkmark status.

Send: back header with subtitle, dark promo banner ("Money moves across Africa"),
3-way mode switch (NORA Transfer / Cross-Border / Non-NORA Recipient), 3 recipient-type
cards (NORA ID, NORA Account, Bank Account) with selected-state highlight, recipient
search + contact button, amount+currency and message side by side, exchange
rate / fee box, Continue -> PIN authorize -> receipt.

Bottom nav: Home, Send, Activity, Accounts, Profile — active tab shows filled icon,
green label, and underline indicator, matching the reference screens exactly.

Accounts: title+subtitle header, balance card, 4 account tiles (Add Money, Manage Banks,
Withdraw, NORA ID), NORA ID verification card (avatar, Verified badge, View Details),
Linked Bank Accounts list (Primary pill, Active status), Funding Options grid (Bank
Transfer, Card Payment, Mobile Money, Cash Deposit), Withdrawal Destinations (Ghana,
available balance, View banks).

Profile: avatar with camera-edit badge, verified badge + Verified pill, NORA ID feature
card (Full KYC Level 2, Show my NORA ID + QR), Account Overview balance card with mini
card graphic, 4 account tiles (Fund Account, Withdraw, Linked Banks, NORA ID), full
settings list (Personal Information, Security & Privacy, KYC Verification [Verified],
Notification Settings, Help & Support, About NORA), and a bottom network promo banner
with Learn More CTA.

Activity: title+subtitle header, date-range pill, filter chips (All/Send/Receive/Add
Money/Withdraw), dark Total Activity trend card (+12% vs last 30 days, View Analytics),
Recent Transactions list with direction icons + flag/bank badge overlay and status pills
(Completed/Processing/Failed with icons), bottom security banner (bank-grade encryption).

## Architecture

See [ARCHITECTURE.md](ARCHITECTURE.md). Highlights:

- Domain layer: integer minor-unit `Money`, FX quotes with expiry, transaction
  state machine (Intent ≠ Authorization enforced in code), canonical NORA IDs.
- Hardened API client: timeouts, request IDs, idempotency keys on all money
  movement, typed errors with `outcomeUnknown` on money-request timeouts.
- Tokens live in the OS keychain/keystore (expo-secure-store); sessions
  restore on cold start. Logged-in ≠ authorized.
- react-navigation shell: auth gate → bottom tabs → money-flow stack, Android
  back + deep links (`nora://`).
- NORA Voice foundation behind a feature flag: replaceable service interfaces
  and a session state machine, no provider coupled in.
- `npm test` — vitest domain suite (19 tests). `npm run typecheck` — strict TS.

## Run it on your phone (dev)
1. Install "Expo Go" from the Play Store / App Store
2. `npm install`
3. `npm start`
4. Scan the QR code with Expo Go (Android) or the Camera app (iOS)

## Build store binaries (EAS)
1. `npm i -g eas-cli`
2. `eas login` (create a free Expo account)
3. `eas build -p android` → installable APK/AAB (no Mac needed)
4. `eas build -p ios` → requires an Apple Developer account ($99/yr) for the store;
   for on-device testing without an account, use Expo Go.

## Notes
- Sandbox pilot: funds are simulated. Backend is the single source of truth.
- Production data lives in Neon Postgres (DATABASE_URL on Vercel) — make sure it
  is connected before testing sign-in against production.
