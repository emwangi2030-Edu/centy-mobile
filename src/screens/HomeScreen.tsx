import React from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { useAuth } from "../context/AuthContext";
import { useHrCapabilities } from "../context/HrCapabilitiesContext";

const G = "#00a865";

export default function HomeScreen() {
  const { user, business } = useAuth();
  const { data, loading, error, meta } = useHrCapabilities();

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <Text style={styles.greet}>Hello,</Text>
      <Text style={styles.name}>{user?.fullName || user?.email || "—"}</Text>
      {business?.businessName ? <Text style={styles.biz}>{business.businessName}</Text> : null}

      {loading ? (
        <ActivityIndicator style={styles.spinner} color={G} />
      ) : error ? (
        <Text style={styles.warn}>Capabilities: {error}</Text>
      ) : null}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>HR modules</Text>
        <Text style={styles.row}>Pay slips: {data.payroll.slips ? "on" : "off"}</Text>
        <Text style={styles.row}>Leave: {data.leaves.balances || data.leaves.applications ? "on" : "off"}</Text>
        <Text style={styles.row}>
          Time &amp; attendance:{" "}
          {data.attendance.timeLogs || data.attendance.checkins || data.attendance.shifts ? "on" : "off"}
        </Text>
        <Text style={styles.rowMuted}>Source: {meta?.source ?? "—"}</Text>
      </View>

      <Text style={styles.hint}>Tabs match what your company enabled in HR capabilities.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: "#f5f6f5" },
  content: { padding: 20, paddingBottom: 32 },
  greet: { fontSize: 15, color: "#6b7280" },
  name: { fontSize: 26, fontWeight: "700", color: "#1a1a1a", marginBottom: 4 },
  biz: { fontSize: 15, color: "#374151", marginBottom: 20 },
  spinner: { marginVertical: 16 },
  warn: { color: "#b45309", marginBottom: 12 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(0,0,0,0.08)",
  },
  cardTitle: { fontSize: 16, fontWeight: "700", color: "#1a1a1a", marginBottom: 10 },
  row: { fontSize: 14, color: "#374151", marginBottom: 6 },
  rowMuted: { fontSize: 12, color: "#9ca3af", marginTop: 8 },
  hint: { fontSize: 13, color: "#6b7280", marginTop: 20, lineHeight: 20 },
});
