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

## Phase 1 (done)

- **Config:** `EXPO_PUBLIC_PAYHUB_BASE_URL` in `.env`
- **HTTP:** `src/lib/payhubFetch.ts` — timeout + abort, Bearer session, `X-Centy-Client: mobile`
- **Auth:** email/password + 2FA verify; token in **SecureStore**
- **Smoke test:** Home screen loads `GET /api/hr/v1/capabilities` after login

## Pay Hub (backend) requirement

Deploy Pay Hub with **Centy Mobile** auth support:

1. **`X-Centy-Client: mobile`** on `POST /api/auth/login` and `POST /api/auth/2fa/verify` — JSON includes **`sessionToken`** (same value as the httpOnly `session_token` cookie on web).
2. **`Authorization: Bearer <sessionToken>`** accepted anywhere `requireAuth` runs (same as cookie).

This repo’s companion changes live under `B2B-Pay-Hub-dev` (`getSessionTokenFromRequest`, login/verify2fa/logout/refreshSession).

## Phase 2 (done)

- **Tabs:** Home, Payslips, Leave, Clock (Attendance), More — visibility from `GET /api/hr/v1/capabilities` (same flags as web).
- **Attendance:** GPS fix (accuracy gate) + `POST /api/hr/v1/attendance/clock-in` / `clock-out` with `location` in JSON; active shift persisted in AsyncStorage (`centyhr_active_clock_in`, same key as web).
- **BFF:** When `location` is sent, Centy HR BFF attempts a soft `Employee Checkin` row (fails quietly if the ERP doctype differs).

## Phase 3 (done)

- **Payslips:** `GET /api/hr/v1/payroll/salary-slips` (period presets), slip detail, **Share PDF** via `expo-print` + `expo-sharing` (summary HTML — not ERP print format).
- **Leave:** `GET /api/hr/v1/leave-balances` and `GET /api/hr/v1/leave-applications` (pull-to-refresh).
- **BFF:** Employees (non–HR bridge) can list/view **their own** salary slips (`CentyHR/bff` payroll routes).

## Next steps

- [ ] Leave apply + submit (POST flows like `leave-hub`)
- [ ] Attendance screen + BFF contract for GPS check-in/out
- [ ] EAS project (`eas build`) and store listings
