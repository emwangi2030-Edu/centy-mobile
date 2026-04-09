import { payhubFetchJson } from "../lib/payhubFetch";

export type SelfServiceMeResponse = {
  data: Record<string, unknown> | null;
};

/** Employee profile for ESS (same as web `employee-workspace` /self-service/me). */
export async function fetchSelfServiceMe(): Promise<SelfServiceMeResponse> {
  return payhubFetchJson<SelfServiceMeResponse>("/api/hr/v1/self-service/me", { timeoutMs: 60_000 });
}

export function pickEmployeeIdFromProfile(data: Record<string, unknown> | null | undefined): string | null {
  if (!data || typeof data !== "object") return null;
  for (const key of ["name", "employee", "employee_id"]) {
    const v = data[key];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return null;
}
