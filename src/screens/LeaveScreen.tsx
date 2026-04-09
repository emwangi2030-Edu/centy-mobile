import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { fetchLeaveApplications, fetchLeaveBalances, type LeaveApplicationRow, type LeaveBalanceRow } from "../api/hr";
import { PayHubApiError } from "../lib/payhubFetch";

const G = "#00a865";

function fmtDate(iso?: string): string {
  if (!iso || !/^\d{4}-\d{2}-\d{2}/.test(iso)) return "—";
  try {
    return new Date(iso.slice(0, 10) + "T12:00:00").toLocaleDateString(undefined, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso.slice(0, 10);
  }
}

function statusColor(s: string): string {
  const x = s.toLowerCase();
  if (x.includes("approv")) return "#047857";
  if (x.includes("reject")) return "#b91c1c";
  if (x.includes("draft")) return "#6b7280";
  if (x.includes("cancel")) return "#6b7280";
  return "#b45309";
}

export default function LeaveScreen() {
  const [balances, setBalances] = useState<LeaveBalanceRow[]>([]);
  const [applications, setApplications] = useState<LeaveApplicationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [b, a] = await Promise.all([fetchLeaveBalances(), fetchLeaveApplications(1, 30, "all")]);
      setBalances(Array.isArray(b.data) ? b.data : []);
      setApplications(Array.isArray(a.data) ? a.data : []);
    } catch (e) {
      const msg =
        e instanceof PayHubApiError ? e.message : e instanceof Error ? e.message : "Could not load leave data";
      setError(msg);
      setBalances([]);
      setApplications([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void load();
  }, [load]);

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={G} />}
    >
      {loading ? (
        <ActivityIndicator color={G} style={{ marginTop: 24 }} />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : null}

      <Text style={styles.section}>Balances</Text>
      {balances.length === 0 && !loading ? (
        <Text style={styles.muted}>No leave allocation rows returned.</Text>
      ) : (
        balances.map((b) => (
          <View key={b.name} style={styles.card}>
            <Text style={styles.cardTitle}>{b.leave_type ?? b.name}</Text>
            <Text style={styles.cardLine}>
              Allocated:{" "}
              <Text style={styles.em}>{b.total_leaves_allocated ?? b.new_leaves_allocated ?? "—"}</Text>
            </Text>
            <Text style={styles.cardSub}>
              {fmtDate(b.from_date)} – {fmtDate(b.to_date)}
            </Text>
          </View>
        ))
      )}

      <Text style={[styles.section, { marginTop: 24 }]}>Recent applications</Text>
      <Text style={styles.mutedSmall}>Includes items where you are employee or approver (same as web).</Text>
      {applications.length === 0 && !loading ? (
        <Text style={styles.muted}>No applications in the first page.</Text>
      ) : (
        applications.map((r, idx) => {
          const st = String(r.status ?? "—");
          return (
            <View key={r.name ? String(r.name) : `leave-${idx}`} style={styles.card}>
              <View style={styles.appHeader}>
                <Text style={styles.cardTitle}>{r.leave_type ?? "Leave"}</Text>
                <Text style={[styles.badge, { color: statusColor(st) }]}>{st}</Text>
              </View>
              <Text style={styles.cardLine}>
                {fmtDate(r.from_date)} → {fmtDate(r.to_date)}
                {r.total_leave_days != null ? ` · ${r.total_leave_days} day(s)` : ""}
              </Text>
              {r.employee_name ? <Text style={styles.cardSub}>{r.employee_name}</Text> : null}
              {r.description ? (
                <Text style={styles.desc} numberOfLines={3}>
                  {r.description}
                </Text>
              ) : null}
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: "#f5f6f5" },
  content: { padding: 16, paddingBottom: 32 },
  section: { fontSize: 13, fontWeight: "800", color: "#6b7280", letterSpacing: 0.5, marginBottom: 10 },
  muted: { fontSize: 14, color: "#6b7280", marginBottom: 8 },
  mutedSmall: { fontSize: 12, color: "#9ca3af", marginBottom: 12, lineHeight: 18 },
  error: { color: "#dc2626", marginBottom: 12 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(0,0,0,0.07)",
  },
  cardTitle: { fontSize: 16, fontWeight: "700", color: "#1a1a1a" },
  cardLine: { fontSize: 14, color: "#374151", marginTop: 6 },
  em: { fontWeight: "800", color: G },
  cardSub: { fontSize: 12, color: "#9ca3af", marginTop: 4 },
  appHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  badge: { fontSize: 12, fontWeight: "800" },
  desc: { fontSize: 13, color: "#6b7280", marginTop: 8, lineHeight: 18 },
});
