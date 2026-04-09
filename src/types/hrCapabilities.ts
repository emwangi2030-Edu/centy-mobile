/**
 * Subset of Pay Hub `GET /api/hr/v1/capabilities` — extend as screens are added.
 * @see B2B-Pay-Hub client `src/lib/hrCapabilities.ts`
 */
export type HrCapabilitiesData = {
  version: number;
  attendance: {
    shifts: boolean;
    checkins: boolean;
    daily: boolean;
    timeLogs: boolean;
    teamView: boolean;
  };
  leaves: {
    applications: boolean;
    submit: boolean;
    approve: boolean;
    balances: boolean;
  };
  payroll: {
    slips: boolean;
    entries: boolean;
  };
  expenses: {
    claims: boolean;
    submit: boolean;
    approve: boolean;
    advances: boolean;
  };
};

export type HrCapabilitiesResponse = {
  data: HrCapabilitiesData;
  meta?: { source?: "bff" | "payhub_fallback"; bffStatus?: number };
};
