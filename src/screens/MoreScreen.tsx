import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useAuth } from "../context/AuthContext";
import { useAppMode } from "../context/AppModeContext";
import { useHrCapabilities } from "../context/HrCapabilitiesContext";

const G = "#00a865";

export default function MoreScreen() {
  const { user, business, logout, canSubmitOnBehalf } = useAuth();
  const { mode, setMode } = useAppMode();
  const { refresh, loading, error } = useHrCapabilities();

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <Text style={styles.section}>Account</Text>
      <Text style={styles.line}>{user?.email}</Text>
      <Text style={styles.muted}>{business?.businessName ?? "No company on profile"}</Text>

      {canSubmitOnBehalf ? (
        <View style={styles.modeBox}>
          <Text style={styles.modeLabel}>Workspace</Text>
          <Text style={styles.modeCurrent}>
            {mode === "admin" ? "Admin (wallet & approvals)" : "Employee (HR self-service)"}
          </Text>
          <Pressable
            style={styles.link}
            onPress={() => void setMode(mode === "admin" ? "employee" : "admin")}
          >
            <Text style={styles.linkText}>
              {mode === "admin" ? "Switch to employee workspace" : "Switch to admin workspace"}
            </Text>
          </Pressable>
        </View>
      ) : null}

      <Pressable style={styles.link} onPress={() => void refresh()} disabled={loading}>
        <Text style={styles.linkText}>{loading ? "Refreshing…" : "Refresh HR capabilities"}</Text>
      </Pressable>
      {error ? <Text style={styles.err}>{error}</Text> : null}

      <Text style={styles.version}>Centy Mobile v1.0.0</Text>

      <Pressable style={styles.logout} onPress={() => void logout()}>
        <Text style={styles.logoutText}>Sign out</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: "#f5f6f5" },
  content: { padding: 20, paddingBottom: 40 },
  section: { fontSize: 13, fontWeight: "700", color: "#6b7280", marginBottom: 8, textTransform: "uppercase" },
  line: { fontSize: 16, fontWeight: "600", color: "#1a1a1a" },
  muted: { fontSize: 14, color: "#6b7280", marginTop: 4, marginBottom: 20 },
  modeBox: {
    marginTop: 16,
    marginBottom: 8,
    padding: 14,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(0,0,0,0.08)",
  },
  modeLabel: { fontSize: 12, fontWeight: "700", color: "#6b7280", textTransform: "uppercase" },
  modeCurrent: { fontSize: 15, fontWeight: "600", color: "#1a1a1a", marginTop: 6, marginBottom: 10 },
  link: { marginBottom: 8 },
  linkText: { color: G, fontSize: 16, fontWeight: "600" },
  err: { color: "#dc2626", fontSize: 13, marginTop: 8 },
  version: { fontSize: 12, color: "#9ca3af", marginTop: 24 },
  logout: {
    marginTop: 28,
    borderWidth: 1,
    borderColor: "#fca5a5",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  logoutText: { color: "#ef4444", fontSize: 16, fontWeight: "700" },
});
