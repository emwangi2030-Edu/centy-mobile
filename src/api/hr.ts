import { payhubFetchJson } from "../lib/payhubFetch";
import type { HrCapabilitiesResponse } from "../types/hrCapabilities";

export async function fetchHrCapabilities(): Promise<HrCapabilitiesResponse> {
  return payhubFetchJson<HrCapabilitiesResponse>("/api/hr/v1/capabilities");
}
