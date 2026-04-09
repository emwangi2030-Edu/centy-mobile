import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { postClockIn, postClockOut } from "../api/hr";
import {
  ensureForegroundLocationPermission,
  getAttendanceLocationFix,
  type CheckInLocationPayload,
} from "../lib/attendanceLocation";
import { clearActiveClock, getActiveClock, setActiveClock, type ActiveClockIn } from "../lib/activeClockStorage";
import { PayHubApiError } from "../lib/payhubFetch";

const G = "#00a865";
const RED = "#dc2626";
/** Reject fixes worse than this so clock-in isn’t recorded with a useless pin (meters). */
const MAX_ACCURACY_M = 220;

function parseFrappeDateTime(s: string): Date | null {
  const str = String(s ?? "").trim();
  if (/^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}$/.test(str)) {
    return new Date(str.replace(" ", "T") + "Z");
  }
  const d = new Date(str);
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatHMS(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const hh = String(Math.floor(s / 3600)).padStart(2, "0");
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}

export default function AttendanceScreen() {
  const [active, setActive] = useState<ActiveClockIn | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [clockingIn, setClockingIn] = useState(false);
  const [clockingOut, setClockingOut] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [gpsNote, setGpsNote] = useState<string | null>(null);
  const [lastCheckinMeta, setLastCheckinMeta] = useState<string | null>(null);

  const fromDate = useMemo(() => (active?.from_time ? parseFrappeDateTime(active.from_time) : null), [active?.from_time]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const stored = await getActiveClock();
      if (!cancelled && stored) setActive(stored);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!fromDate) return;
    const t = setInterval(() => {
      const now = Date.now();
      setElapsedSeconds(Math.floor((now - fromDate.getTime()) / 1000));
    }, 500);
    return () => clearInterval(t);
  }, [fromDate?.getTime()]);

  const captureLocation = useCallback(async (): Promise<CheckInLocationPayload> => {
    const ok = await ensureForegroundLocationPermission();
    if (!ok) {
      throw new PayHubApiError("Location permission is required for attendance.", 0);
    }
    const fix = await getAttendanceLocationFix();
    if (fix.accuracyMeters != null && fix.accuracyMeters > MAX_ACCURACY_M) {
      throw new PayHubApiError(
        `GPS accuracy is poor (${Math.round(fix.accuracyMeters)} m). Try outdoors or wait for a better fix.`,
        0
      );
    }
    setGpsNote(
      `${fix.latitude.toFixed(5)}, ${fix.longitude.toFixed(5)}` +
        (fix.accuracyMeters != null ? ` · ±${Math.round(fix.accuracyMeters)} m` : "")
    );
    return fix;
  }, []);

  async function onClockIn() {
    setMessage(null);
    setLastCheckinMeta(null);
    setClockingIn(true);
    try {
      const loc = await captureLocation();
      const j = await postClockIn(loc);
      const d = j.data;
      const next: ActiveClockIn = {
        from_time: String(d.from_time ?? ""),
        shift_assignment_name: String(d.shift_assignment ?? ""),
        attendance_date: String(d.attendance_date ?? ""),
        shift_type: String(d.shift_type ?? ""),
      };
      if (!next.from_time || !next.shift_assignment_name) {
        throw new Error("Clock in response missing required fields.");
      }
      await setActiveClock(next);
      setActive(next);
      const ec = j.meta?.employee_checkin;
      setLastCheckinMeta(
        ec?.recorded ? "GPS check-in saved to Employee Checkin." : ec?.reason ? `GPS audit: ${ec.reason}` : ""
      );
      setMessage(`Clocked in · ${next.shift_type}`);
    } catch (e) {
      const msg = e instanceof PayHubApiError ? e.message : e instanceof Error ? e.message : String(e);
      setMessage(msg);
      setGpsNote(null);
    } finally {
      setClockingIn(false);
    }
  }

  async function onClockOut() {
    if (!active) return;
    setMessage(null);
    setLastCheckinMeta(null);
    setClockingOut(true);
    try {
      const loc = await captureLocation();
      const j = await postClockOut({
        from_time: active.from_time,
        shift_assignment_name: active.shift_assignment_name,
        location: loc,
      });
      const d = j.data;
      await clearActiveClock();
      setActive(null);
      setElapsedSeconds(0);
      const ec = j.meta?.employee_checkin;
      setLastCheckinMeta(
        ec?.recorded ? "GPS check-out saved to Employee Checkin." : ec?.reason ? `GPS audit: ${ec.reason}` : ""
      );
      setMessage(
        `Clocked out · regular ${Number(d.regular_hours ?? 0)}h, OT ${Number(d.overtime_hours ?? 0)}h`
      );
      setGpsNote(null);
    } catch (e) {
      const msg = e instanceof PayHubApiError ? e.message : e instanceof Error ? e.message : String(e);
      setMessage(msg);
    } finally {
      setClockingOut(false);
    }
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <View style={styles.rowTop}>
          <View>
            <Text style={styles.kicker}>Time logging</Text>
            <Text style={styles.date}>
              {active?.attendance_date ? active.attendance_date : "Today"}
            </Text>
          </View>
          <View style={[styles.badge, active ? styles.badgeOn : styles.badgeOff]}>
            <Text style={styles.badgeTxt}>{active ? "IN" : "READY"}</Text>
          </View>
        </View>

        <View style={styles.timerBox}>
          <Text style={styles.timer}>{active ? formatHMS(elapsedSeconds) : "00:00:00"}</Text>
          <Text style={styles.timerSub}>
            {active ? `Started ${active.from_time.slice(0, 16)}` : "Requires GPS fix for each action"}
          </Text>
        </View>

        {gpsNote ? <Text style={styles.gps}>Last fix: {gpsNote}</Text> : null}
        {lastCheckinMeta ? <Text style={styles.meta}>{lastCheckinMeta}</Text> : null}

        {!active ? (
          <Pressable
            style={[styles.btn, styles.btnIn, clockingIn && styles.btnDis]}
            onPress={() => void onClockIn()}
            disabled={clockingIn}
          >
            {clockingIn ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnTxt}>Clock in (GPS)</Text>
            )}
          </Pressable>
        ) : (
          <Pressable
            style={[styles.btn, styles.btnOut, clockingOut && styles.btnDis]}
            onPress={() => void onClockOut()}
            disabled={clockingOut}
          >
            {clockingOut ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnTxt}>Clock out (GPS)</Text>
            )}
          </Pressable>
        )}

        {active?.shift_type ? (
          <Text style={styles.shift}>Shift: {active.shift_type}</Text>
        ) : null}

        {message ? (
          <Text style={[styles.feedback, message.includes("failed") || message.includes("accuracy") ? styles.feedbackErr : null]}>
            {message}
          </Text>
        ) : null}
      </View>

      <Text style={styles.legal}>
        Location is captured when you clock in or out and sent to Pay Hub for optional Employee Checkin audit
        (same timesheet rules as the web time log).
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: "#f5f6f5" },
  content: { padding: 16, paddingBottom: 32 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 18,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(0,0,0,0.08)",
  },
  rowTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  kicker: { fontSize: 11, fontWeight: "700", color: "#6b7280", letterSpacing: 0.6 },
  date: { fontSize: 16, fontWeight: "700", color: "#1a1a1a", marginTop: 4 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeOn: { backgroundColor: "#e4f5ec" },
  badgeOff: { backgroundColor: "#f3f4f6" },
  badgeTxt: { fontSize: 11, fontWeight: "800", color: "#374151" },
  timerBox: {
    marginTop: 20,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
    paddingVertical: 16,
    backgroundColor: "#fafafa",
  },
  timer: { fontSize: 28, fontFamily: "monospace", textAlign: "center", color: "#1a1a1a", fontVariant: ["tabular-nums"] },
  timerSub: { textAlign: "center", fontSize: 12, color: "#6b7280", marginTop: 6 },
  gps: { fontSize: 12, color: "#374151", marginTop: 14 },
  meta: { fontSize: 12, color: G, marginTop: 6, fontWeight: "600" },
  btn: { marginTop: 20, borderRadius: 12, paddingVertical: 14, alignItems: "center" },
  btnIn: { backgroundColor: G },
  btnOut: { backgroundColor: RED },
  btnDis: { opacity: 0.75 },
  btnTxt: { color: "#fff", fontSize: 16, fontWeight: "800" },
  shift: { marginTop: 12, fontSize: 12, color: "#6b7280" },
  feedback: { marginTop: 14, fontSize: 14, color: "#374151", lineHeight: 20 },
  feedbackErr: { color: RED },
  legal: { marginTop: 20, fontSize: 12, color: "#9ca3af", lineHeight: 18 },
});
