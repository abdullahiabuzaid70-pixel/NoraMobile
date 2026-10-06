# Building NORA — installable apps

The repo is EAS-ready. Builds run on Expo's cloud (needs your Expo account,
one-time `npx eas login`), so no local Android SDK / Mac is required.

## Install on your Android phone (APK)
1. `npx eas login` (first time only)
2. `npx eas build -p android --profile preview`
3. EAS prints a download URL (also emailed / on the EAS dashboard) — open it
   on your phone and install the APK (allow "install unknown apps" once).

## Install on iPhone
Real iOS devices require a paid Apple Developer account ($99/yr) or an ad-hoc
profile. Until then:
- Simulator build (Mac only): `npx eas build -p ios --profile preview`
- Test on a real device via Expo Go during development: `npx expo start`

## App Store / Play Store (production)
1. `npx eas build -p all --profile production` → .aab + .ipa
2. `npx eas submit -p android` / `npx eas submit -p ios` after store accounts
   are linked (`npx eas credentials`, Google Play / App Store Connect).

## CI (optional)
`.github/workflows/eas-build.yml` is manual-trigger only (GitHub repo > Actions >
EAS Preview Build > Run workflow). It needs an `EXPO_TOKEN` repo secret first:
1. Generate a token at https://expo.dev/accounts/[your-account]/settings/access-tokens
2. In the repo: Settings > Secrets and variables > Actions > New repository secret
   Name: `EXPO_TOKEN`, Value: the token from step 1
Without that secret the workflow fails fast on purpose (clear error, no spam) —
it no longer runs automatically on push, so it won't email you on every commit.

## Notes
- `eas.json` "preview" builds are unsigned-for-store, internal distribution.
- Version lives in `app.json`; `appVersionSource: remote` lets EAS manage it.
- Icons/splash still default — replace `assets/icon.png`, `adaptive-icon.png`,
  `splash-icon.png` with brand assets when ready.
