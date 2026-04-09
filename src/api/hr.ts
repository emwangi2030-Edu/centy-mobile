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
