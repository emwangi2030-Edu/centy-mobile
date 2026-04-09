/**
 * Mirrors Pay Hub `client/src/lib/hrCapabilities.ts` — keep in sync when extending flags.
 */
export const HR_CAPABILITIES_VERSION = 1 as const;

export type HrCapabilitiesData = {
  version: typeof HR_CAPABILITIES_VERSION;
  people: {
    directory: boolean;
    createEmployee: boolean;
    sendInvite: boolean;
    editEmployee: boolean;
    exitEmployee: boolean;
    orgOptions: boolean;
    lifecycle: boolean;
  };
  assets: {
    registry: boolean;
    assign: boolean;
    requisitions: "none" | "view" | "approve";
    disposals: "hidden" | "view" | "create";
  };
  leaves: {
    applications: boolean;
    submit: boolean;
    approve: boolean;
    balances: boolean;
  };
  attendance: {
    shifts: boolean;
    checkins: boolean;
    daily: boolean;
    timeLogs: boolean;
    teamView: boolean;
  };
  payroll: {
    slips: boolean;
    entries: boolean;
  };
  loans: {
    selfService: boolean;
  };
  recruitment: {
    enabled: boolean;
    referrals: boolean;
  };
  performance: {
    enabled: boolean;
    goals: boolean;
    selfAppraisal: boolean;
  };
  expenses: {
    claims: boolean;
    submit: boolean;
    approve: boolean;
    advances: boolean;
  };
  documents: {
    employeeVault: boolean;
    companyVault: boolean;
  };
};

export const DEFAULT_HR_CAPABILITIES: HrCapabilitiesData = {
  version: HR_CAPABILITIES_VERSION,
  people: {
    directory: true,
    createEmployee: true,
    sendInvite: true,
    editEmployee: true,
    exitEmployee: true,
    orgOptions: true,
    lifecycle: true,
  },
  assets: {
    registry: true,
    assign: true,
    requisitions: "approve",
    disposals: "create",
  },
  leaves: {
    applications: true,
    submit: true,
    approve: true,
    balances: true,
  },
  attendance: {
    shifts: true,
    checkins: true,
    daily: true,
    timeLogs: true,
    teamView: true,
  },
  payroll: {
    slips: true,
    entries: true,
  },
  loans: {
    selfService: true,
  },
  recruitment: {
    enabled: true,
    referrals: true,
  },
  performance: {
    enabled: true,
    goals: true,
    selfAppraisal: true,
  },
  expenses: {
    claims: true,
    submit: true,
    approve: true,
    advances: true,
  },
  documents: {
    employeeVault: true,
    companyVault: false,
  },
};

export type HrCapabilitiesResponse = {
  data: HrCapabilitiesData;
  meta?: { source?: "bff" | "payhub_fallback"; bffStatus?: number };
};
