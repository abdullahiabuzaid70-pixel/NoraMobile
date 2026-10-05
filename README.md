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

## Design preview
`assets/design-preview.png` — the sign-in and home screens as built (colors, layout, and flows match the code).

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
