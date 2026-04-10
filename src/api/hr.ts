import { payhubFetchJson, type PayhubFetchOptions } from "../lib/payhubFetch";
import type { CheckInLocationPayload } from "../lib/attendanceLocation";
import type { HrCapabilitiesResponse } from "../types/hrCapabilities";

export async function fetchHrCapabilities(): Promise<HrCapabilitiesResponse> {
  return payhubFetchJson<HrCapabilitiesResponse>("/api/hr/v1/capabilities");
}

export type EmployeeCheckinMeta = { recorded: boolean; reason?: string };

export type ClockInResponse = {
  data: {
    from_time: string;
    attendance: string;
    attendance_date: string;
    shift_assignment: string;
    shift_type: string;
    project?: string | null;
    shift_location?: string | null;
  };
  meta?: { employee_checkin?: EmployeeCheckinMeta };
};

export type ClockOutResponse = {
  data: {
    timesheet: string;
    attendance_date: string;
    shift_assignment: string;
    regular_hours: number;
    overtime_hours: number;
  };
  meta?: { employee_checkin?: EmployeeCheckinMeta };
};

function locationBody(loc: CheckInLocationPayload) {
  return {
    latitude: loc.latitude,
    longitude: loc.longitude,
    accuracy_meters: loc.accuracyMeters,
    recorded_at: loc.recordedAt,
  };
}

/** Same as web `time-log-clock`: POST with optional JSON body for GPS (`location`). */
export async function postClockIn(location?: CheckInLocationPayload | null): Promise<ClockInResponse> {
  const init: PayhubFetchOptions = { method: "POST" };
  if (location) {
    init.headers = { "Content-Type": "application/json" };
    init.body = JSON.stringify({ location: locationBody(location) });
  }
  return payhubFetchJson<ClockInResponse>("/api/hr/v1/attendance/clock-in", init);
}

export async function postClockOut(payload: {
  from_time: string;
  shift_assignment_name: string;
  location?: CheckInLocationPayload | null;
}): Promise<ClockOutResponse> {
  const body: Record<string, unknown> = {
    from_time: payload.from_time,
    shift_assignment_name: payload.shift_assignment_name,
  };
  if (payload.location) {
    body.location = locationBody(payload.location);
  }
  return payhubFetchJson<ClockOutResponse>("/api/hr/v1/attendance/clock-out", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const HR_LIST_TIMEOUT: PayhubFetchOptions = { timeoutMs: 60_000 };

export type SalarySlipRow = {
  name?: string;
  employee?: string;
  employee_name?: string;
  posting_date?: string;
  start_date?: string;
  end_date?: string;
  currency?: string;
  status?: string;
  docstatus?: number;
};

/** Self-service: omit `employee` (BFF uses linked Employee). HR mobile may pass `employee`. */
export async function fetchSalarySlips(
  fromDate: string,
  toDate: string,
  employee?: string | null
): Promise<{ data: SalarySlipRow[] }> {
  const p = new URLSearchParams({ from_date: fromDate, to_date: toDate });
  if (employee?.trim()) p.set("employee", employee.trim());
  return payhubFetchJson<{ data: SalarySlipRow[] }>(
    `/api/hr/v1/payroll/salary-slips?${p}`,
    HR_LIST_TIMEOUT
  );
}

export async function fetchSalarySlipDetail(
  slipName: string
): Promise<{ data: Record<string, unknown> }> {
  const enc = encodeURIComponent(slipName);
  return payhubFetchJson<{ data: Record<string, unknown> }>(
    `/api/hr/v1/payroll/salary-slips/${enc}`,
    HR_LIST_TIMEOUT
  );
}

export type LeaveBalanceRow = {
  name: string;
  leave_type?: string;
  from_date?: string;
  to_date?: string;
  new_leaves_allocated?: number;
  total_leaves_allocated?: number;
  carry_forward?: number;
  docstatus?: number;
};

export async function fetchLeaveBalances(): Promise<{ data: LeaveBalanceRow[] }> {
  return payhubFetchJson<{ data: LeaveBalanceRow[] }>("/api/hr/v1/leave-balances", HR_LIST_TIMEOUT);
}

export type LeaveApplicationRow = {
  name?: string;
  employee?: string;
  leave_type?: string;
  from_date?: string;
  to_date?: string;
  total_leave_days?: number;
  status?: string;
  employee_name?: string;
  description?: string;
};

export async function fetchLeaveApplications(
  page = 1,
  pageSize = 25,
  status: string | "all" = "all"
): Promise<{
  data: LeaveApplicationRow[];
  meta?: { page: number; page_size: number; has_more: boolean };
}> {
  const q = new URLSearchParams({ page: String(page), page_size: String(pageSize) });
  if (status !== "all") q.set("status", status);
  return payhubFetchJson(`/api/hr/v1/leave-applications?${q}`, HR_LIST_TIMEOUT);
}

export async function postLeaveApplicationApprove(leaveId: string): Promise<void> {
  const enc = encodeURIComponent(leaveId);
  await payhubFetchJson<{ ok?: boolean }>(`/api/hr/v1/leave-applications/${enc}/approve`, {
    method: "POST",
    ...HR_LIST_TIMEOUT,
  });
}

export async function postLeaveApplicationReject(leaveId: string, reason: string): Promise<void> {
  const enc = encodeURIComponent(leaveId);
  await payhubFetchJson<{ ok?: boolean }>(`/api/hr/v1/leave-applications/${enc}/reject`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reason: reason.trim() }),
    ...HR_LIST_TIMEOUT,
  });
}

export type ExpenseClaimRow = {
  name?: string;
  employee?: string;
  employee_name?: string;
  posting_date?: string;
  approval_status?: string;
  expense_approver?: string;
  docstatus?: number;
  grand_total?: number | string | null;
  total_claimed_amount?: number | string | null;
  total_amount_reimbursed?: number | string | null;
};

export async function fetchExpensesPendingApproval(
  page = 1,
  pageSize = 40
): Promise<{
  data: ExpenseClaimRow[];
  meta?: { page: number; page_size: number; has_more: boolean };
}> {
  const q = new URLSearchParams({ page: String(page), page_size: String(pageSize) });
  return payhubFetchJson(`/api/hr/v1/expenses/pending-approval?${q}`, HR_LIST_TIMEOUT);
}

export async function fetchExpensesReadyToPay(
  page = 1,
  pageSize = 40
): Promise<{
  data: ExpenseClaimRow[];
  meta?: { page: number; page_size: number; has_more: boolean };
}> {
  const q = new URLSearchParams({ page: String(page), page_size: String(pageSize) });
  return payhubFetchJson(`/api/hr/v1/expenses/ready-to-pay?${q}`, HR_LIST_TIMEOUT);
}

export async function postExpenseClaimApprove(claimId: string): Promise<void> {
  const enc = encodeURIComponent(claimId);
  await payhubFetchJson<{ ok?: boolean }>(`/api/hr/v1/expenses/${enc}/approve`, {
    method: "POST",
    ...HR_LIST_TIMEOUT,
  });
}

export async function postExpenseClaimReject(claimId: string, reason: string): Promise<void> {
  const enc = encodeURIComponent(claimId);
  await payhubFetchJson<{ ok?: boolean }>(`/api/hr/v1/expenses/${enc}/reject`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reason: reason.trim() }),
    ...HR_LIST_TIMEOUT,
  });
}

export type MarkExpensePaidPayload = {
  paid_at?: string;
  payment_ref?: string;
  payment_account?: string;
  /** Default on BFF is `wallet`. */
  payment_mode?: "wallet" | "offline";
};

export async function postExpenseClaimMarkPaid(
  claimId: string,
  payload: MarkExpensePaidPayload = {}
): Promise<void> {
  const enc = encodeURIComponent(claimId);
  const body: Record<string, string> = {};
  if (payload.paid_at?.trim()) body.paid_at = payload.paid_at.trim();
  if (payload.payment_ref?.trim()) body.payment_ref = payload.payment_ref.trim();
  if (payload.payment_account?.trim()) body.payment_account = payload.payment_account.trim();
  if (payload.payment_mode) body.payment_mode = payload.payment_mode;

  await payhubFetchJson<{ ok?: boolean }>(`/api/hr/v1/expenses/${enc}/mark-paid`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    ...HR_LIST_TIMEOUT,
  });
}
