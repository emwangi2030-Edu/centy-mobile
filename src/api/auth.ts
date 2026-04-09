import { setStoredSessionToken, clearStoredSessionToken } from "../lib/authStorage";
import { payhubFetch, payhubFetchJson, PayHubApiError } from "../lib/payhubFetch";
import type { Login2FAPayload, LoginSuccessPayload, MeResponse } from "../types/auth";

function parseJsonBody(text: string): unknown {
  if (!text) return {};
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return {};
  }
}

export type LoginResult =
  | { kind: "2fa"; tempToken: string; method: "totp" | "email_otp" }
  | { kind: "success" };

/**
 * Password login. On success, stores `sessionToken` from JSON (requires Pay Hub with mobile header support).
 */
export async function postLogin(email: string, password: string): Promise<LoginResult> {
  const res = await payhubFetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
    sessionAuth: false,
  });
  const text = await res.text();
  const body = parseJsonBody(text) as Record<string, unknown>;

  if (!res.ok) {
    const msg = typeof body.message === "string" ? body.message : text || res.statusText;
    throw new PayHubApiError(msg, res.status, typeof body.code === "string" ? body.code : undefined);
  }

  const maybe2fa = body as unknown as Login2FAPayload;
  if (maybe2fa.requires2FA === true && typeof maybe2fa.tempToken === "string") {
    const method = maybe2fa.method === "email_otp" ? "email_otp" : "totp";
    return { kind: "2fa", tempToken: maybe2fa.tempToken, method };
  }

  const success = body as unknown as LoginSuccessPayload;
  if (typeof success.sessionToken === "string") {
    await setStoredSessionToken(success.sessionToken);
    return { kind: "success" };
  }

  throw new PayHubApiError(
    "Login succeeded but no sessionToken. Deploy Pay Hub with Centy Mobile auth (Bearer + X-Centy-Client).",
    500
  );
}

export async function postVerify2fa(tempToken: string, token: string): Promise<void> {
  const res = await payhubFetch("/api/auth/2fa/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tempToken, token }),
    sessionAuth: false,
  });
  const text = await res.text();
  const body = parseJsonBody(text) as Record<string, unknown>;

  if (!res.ok) {
    const msg = typeof body.message === "string" ? body.message : text || res.statusText;
    throw new PayHubApiError(msg, res.status);
  }

  const success = body as unknown as LoginSuccessPayload;
  if (typeof success.sessionToken === "string") {
    await setStoredSessionToken(success.sessionToken);
    return;
  }

  throw new PayHubApiError(
    "2FA succeeded but no sessionToken. Deploy Pay Hub with Centy Mobile auth.",
    500
  );
}

export async function getMe(): Promise<MeResponse> {
  return payhubFetchJson<MeResponse>("/api/auth/me");
}

export async function postLogout(): Promise<void> {
  try {
    await payhubFetch("/api/auth/logout", { method: "POST" });
  } catch {
    /* still clear local session */
  } finally {
    await clearStoredSessionToken();
  }
}
