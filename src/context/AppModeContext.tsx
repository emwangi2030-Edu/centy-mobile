import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { readStoredAppMode, writeStoredAppMode, type AppMode } from "../lib/appModeStorage";
import { useAuth } from "./AuthContext";

type AppModeContextValue = {
  mode: AppMode;
  /** False until AsyncStorage has been read (avoid flashing wrong navigator). */
  ready: boolean;
  setMode: (mode: AppMode) => Promise<void>;
};

const AppModeContext = createContext<AppModeContextValue | null>(null);

export function AppModeProvider({ children }: { children: ReactNode }) {
  const { user, canSubmitOnBehalf } = useAuth();
  const [mode, setModeState] = useState<AppMode>("employee");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!user) {
        setModeState("employee");
        setReady(true);
        return;
      }
      try {
        const stored = await readStoredAppMode();
        if (cancelled) return;
        let next: AppMode = stored ?? "employee";
        if (next === "admin" && !canSubmitOnBehalf) next = "employee";
        setModeState(next);
      } finally {
        if (!cancelled) setReady(true);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [user?.id, canSubmitOnBehalf]);

  useEffect(() => {
    if (!canSubmitOnBehalf && mode === "admin") {
      setModeState("employee");
      void writeStoredAppMode("employee");
    }
  }, [canSubmitOnBehalf, mode]);

  const setMode = useCallback(
    async (next: AppMode) => {
      if (next === "admin" && !canSubmitOnBehalf) return;
      setModeState(next);
      await writeStoredAppMode(next);
    },
    [canSubmitOnBehalf]
  );

  const value = useMemo<AppModeContextValue>(
    () => ({ mode, ready, setMode }),
    [mode, ready, setMode]
  );

  return <AppModeContext.Provider value={value}>{children}</AppModeContext.Provider>;
}

export function useAppMode(): AppModeContextValue {
  const ctx = useContext(AppModeContext);
  if (!ctx) throw new Error("useAppMode must be used within AppModeProvider");
  return ctx;
}
