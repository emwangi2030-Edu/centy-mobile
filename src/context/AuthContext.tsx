import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getMe, postLogin, postLogout, postVerify2fa } from "../api/auth";
import { getStoredSessionToken, clearStoredSessionToken } from "../lib/authStorage";
import { clearStoredAppMode } from "../lib/appModeStorage";
import { PayHubApiError } from "../lib/payhubFetch";
import type { AuthBusiness, AuthUser, MeResponse } from "../types/auth";

type TwoFactorChallenge = { tempToken: string; method: "totp" | "email_otp" };

type AuthContextValue = {
  ready: boolean;
  user: AuthUser | null;
  business: AuthBusiness;
  canSubmitOnBehalf: boolean;
  isImpersonating: boolean;
  isImpersonatingUser: boolean;
  impersonatedUserName: string | null;
  impersonatedUserRole: string | null;
  twoFactor: TwoFactorChallenge | null;
  error: string | null;
  clearError: () => void;
  login: (email: string, password: string) => Promise<void>;
  verify2FA: (code: string) => Promise<void>;
  cancel2FA: () => void;
  logout: () => Promise<void>;
  refreshMe: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [business, setBusiness] = useState<AuthBusiness>(null);
  const [canSubmitOnBehalf, setCanSubmitOnBehalf] = useState(false);
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [isImpersonatingUser, setIsImpersonatingUser] = useState(false);
  const [impersonatedUserName, setImpersonatedUserName] = useState<string | null>(null);
  const [impersonatedUserRole, setImpersonatedUserRole] = useState<string | null>(null);
  const [twoFactor, setTwoFactor] = useState<TwoFactorChallenge | null>(null);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const applyMe = useCallback((me: MeResponse) => {
    setUser(me.user);
    setBusiness(me.business ?? null);
    setCanSubmitOnBehalf(!!me.canSubmitOnBehalf);
    setIsImpersonating(!!me.isImpersonating);
    setIsImpersonatingUser(!!me.isImpersonatingUser);
    setImpersonatedUserName(
      typeof me.impersonatedUserName === "string" && me.impersonatedUserName.trim()
        ? me.impersonatedUserName.trim()
        : null
    );
    setImpersonatedUserRole(
      typeof me.impersonatedUserRole === "string" && me.impersonatedUserRole.trim()
        ? me.impersonatedUserRole.trim()
        : null
    );
  }, []);

  const refreshMe = useCallback(async () => {
    const me = await getMe();
    applyMe(me);
  }, [applyMe]);

  useEffect(() => {
    let cancelled = false;
    async function boot() {
      try {
        const token = await getStoredSessionToken();
        if (token) {
          try {
            const me = await getMe();
            if (cancelled) return;
            applyMe(me);
          } catch {
            if (!cancelled) await clearStoredSessionToken();
          }
        }
      } finally {
        if (!cancelled) setReady(true);
      }
    }
    void boot();
    return () => {
      cancelled = true;
    };
  }, [applyMe]);

  const login = useCallback(async (email: string, password: string) => {
    setError(null);
    setTwoFactor(null);
    try {
      const result = await postLogin(email, password);
      if (result.kind === "2fa") {
        setTwoFactor({ tempToken: result.tempToken, method: result.method });
        return;
      }
      await refreshMe();
    } catch (e) {
      const msg = e instanceof PayHubApiError ? e.message : e instanceof Error ? e.message : "Login failed";
      setError(msg);
      throw e;
    }
  }, [refreshMe]);

  const verify2FA = useCallback(
    async (code: string) => {
      if (!twoFactor) return;
      setError(null);
      try {
        await postVerify2fa(twoFactor.tempToken, code.trim());
        setTwoFactor(null);
        await refreshMe();
      } catch (e) {
        const msg =
          e instanceof PayHubApiError ? e.message : e instanceof Error ? e.message : "Verification failed";
        setError(msg);
        throw e;
      }
    },
    [twoFactor, refreshMe]
  );

  const cancel2FA = useCallback(() => {
    setTwoFactor(null);
    setError(null);
  }, []);

  const logout = useCallback(async () => {
    setError(null);
    setTwoFactor(null);
    await postLogout();
    await clearStoredAppMode();
    setUser(null);
    setBusiness(null);
    setCanSubmitOnBehalf(false);
    setIsImpersonating(false);
    setIsImpersonatingUser(false);
    setImpersonatedUserName(null);
    setImpersonatedUserRole(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      ready,
      user,
      business,
      canSubmitOnBehalf,
      isImpersonating,
      isImpersonatingUser,
      impersonatedUserName,
      impersonatedUserRole,
      twoFactor,
      error,
      clearError,
      login,
      verify2FA,
      cancel2FA,
      logout,
      refreshMe,
    }),
    [
      ready,
      user,
      business,
      canSubmitOnBehalf,
      isImpersonating,
      isImpersonatingUser,
      impersonatedUserName,
      impersonatedUserRole,
      twoFactor,
      error,
      clearError,
      login,
      verify2FA,
      cancel2FA,
      logout,
      refreshMe,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
