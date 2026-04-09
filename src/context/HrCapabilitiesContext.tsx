import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { fetchHrCapabilities } from "../api/hr";
import { PayHubApiError } from "../lib/payhubFetch";
import {
  DEFAULT_HR_CAPABILITIES,
  type HrCapabilitiesData,
  type HrCapabilitiesResponse,
} from "../types/hrCapabilities";
import { useAuth } from "./AuthContext";

type HrCapabilitiesContextValue = {
  data: HrCapabilitiesData;
  meta: HrCapabilitiesResponse["meta"];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

const HrCapabilitiesContext = createContext<HrCapabilitiesContextValue | null>(null);

export function HrCapabilitiesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [data, setData] = useState<HrCapabilitiesData>(DEFAULT_HR_CAPABILITIES);
  const [meta, setMeta] = useState<HrCapabilitiesResponse["meta"]>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user) {
      setData(DEFAULT_HR_CAPABILITIES);
      setMeta(undefined);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetchHrCapabilities();
      setData(res.data);
      setMeta(res.meta);
    } catch (e) {
      const msg =
        e instanceof PayHubApiError ? e.message : e instanceof Error ? e.message : "Capabilities failed";
      setError(msg);
      setData(DEFAULT_HR_CAPABILITIES);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo<HrCapabilitiesContextValue>(
    () => ({ data, meta, loading, error, refresh }),
    [data, meta, loading, error, refresh]
  );

  return <HrCapabilitiesContext.Provider value={value}>{children}</HrCapabilitiesContext.Provider>;
}

export function useHrCapabilities(): HrCapabilitiesContextValue {
  const ctx = useContext(HrCapabilitiesContext);
  if (!ctx) throw new Error("useHrCapabilities must be used within HrCapabilitiesProvider");
  return ctx;
}
