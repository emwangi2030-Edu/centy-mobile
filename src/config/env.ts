/**
 * Pay Hub origin (same host the web app uses). Set in `.env` as EXPO_PUBLIC_PAYHUB_BASE_URL.
 */
export function getPayHubBaseUrl(): string | null {
  const raw = process.env.EXPO_PUBLIC_PAYHUB_BASE_URL;
  const u = (raw ?? "").trim().replace(/\/$/, "");
  return u || null;
}
