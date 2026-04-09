# Centy Mobile

Employee self-service for **Centy**, built with [Expo](https://expo.dev) (Android + iOS). The app will call the same Pay Hub HR surface as the web client (`/api/hr/v1/...`).

**Repository:** [github.com/emwangi2030-Edu/centy-mobile](https://github.com/emwangi2030-Edu/centy-mobile)

## Requirements

- **Node.js ≥ 20.19.4** (Expo SDK 54 / React Native 0.81). Use [nvm](https://github.com/nvm-sh/nvm): `nvm install` (see `.nvmrc`).
- npm or pnpm
- For iOS builds: macOS + Xcode, or [EAS Build](https://docs.expo.dev/build/introduction/)

## Setup

```bash
cp .env.example .env
# Set EXPO_PUBLIC_PAYHUB_BASE_URL to your staging or production Pay Hub origin (no trailing slash).

npm install
npx expo start
```

## Environment

| Variable | Description |
|----------|-------------|
| `EXPO_PUBLIC_PAYHUB_BASE_URL` | e.g. `https://staging.centyhq.com` — used for HR API calls |

## Attendance (GPS)

`expo-location` is included. iOS/Android permission strings are set in `app.json`. Implement check-in/out by sending `latitude`, `longitude`, `accuracy`, and `timestamp` to your HR BFF via Pay Hub; **geofence validation should be enforced on the server**.

## First push to GitHub

If this folder was cloned from an empty repo:

```bash
git add -A
git commit -m "chore: initial Expo SDK 54 app + expo-location"
git branch -M main
git push -u origin main
```

## Next steps

- [ ] Wire auth (session cookies or bearer tokens against Pay Hub)
- [ ] Add `hrFetch`-style client + `GET /api/hr/v1/capabilities` for tab gating
- [ ] Attendance screen + BFF contract for GPS check-in/out
- [ ] EAS project (`eas build`) and store listings
