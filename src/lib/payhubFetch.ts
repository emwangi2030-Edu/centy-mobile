import { getPayHubBaseUrl } from "../config/env";
import { CENTY_MOBILE_HEADERS } from "../constants";
import { clearStoredSessionToken, getStoredSessionToken } from "./authStorage";

export class PayHubApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string
  ) {
    super(message);
    this.name = "PayHubApiError";
  }
}

export type PayhubFetchOptions = RequestInit & {
  timeoutMs?: number;
  /** When false, omit `Authorization` (login and 2FA verify). Default true. */
  sessionAuth?: boolean;
};

const DEFAULT_TIMEOUT_MS = 120_000;

/**
 * Fetch against Pay Hub with optional Bearer session, timeout, and abort composition (mirrors web `hrFetch`).
 */
export async function payhubFetch(path: string, options: PayhubFetchOptions = {}): Promise<Response> {
  const base = getPayHubBaseUrl();
  if (!base) {
    throw new PayHubApiError("Set EXPO_PUBLIC_PAYHUB_BASE_URL in .env (see .env.example).", 0);
  }

  const { timeoutMs = DEFAULT_TIMEOUT_MS, signal: userSignal, sessionAuth = true, headers: hdrs, ...rest } =
    options;

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  if (userSignal) {
    if (userSignal.aborted) ctrl.abort();
    else userSignal.addEventListener("abort", () => ctrl.abort(), { once: true });
  }

  const headers = new Headers(hdrs as HeadersInit);
  for (const [k, v] of Object.entries(CENTY_MOBILE_HEADERS)) {
    if (!headers.has(k)) headers.set(k, v);
  }

  if (sessionAuth) {
    const token = await getStoredSessionToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  const url = path.startsWith("http") ? path : `${base}${path.startsWith("/") ? path : `/${path}`}`;

  try {
    return await fetch(url, { ...rest, headers, signal: ctrl.signal });
  } finally {
    clearTimeout(timer);
  }
}

export async function payhubFetchJson<T>(path: string, options: PayhubFetchOptions = {}): Promise<T> {
  const res = await payhubFetch(path, options);
  const text = await res.text();

  if (res.status === 401) {
    await clearStoredSessionToken();
  }

  if (!res.ok) {
    let message = text || res.statusText;
    let code: string | undefined;
    try {
      const body = text ? (JSON.parse(text) as { message?: string; error?: string; code?: string }) : {};
      if (typeof body.message === "string") message = body.message;
      else if (typeof body.error === "string") message = body.error;
      if (typeof body.code === "string") code = body.code;
    } catch {
      /* keep message */
    }
    throw new PayHubApiError(message, res.status, code);
  }

  if (!text) {
    return undefined as T;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new PayHubApiError("Invalid JSON from Pay Hub", res.status);
  }
}
