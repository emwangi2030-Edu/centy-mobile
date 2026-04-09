import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useAuth } from "../context/AuthContext";
import { fetchHrCapabilities } from "../api/hr";
import { PayHubApiError } from "../lib/payhubFetch";
import type { HrCapabilitiesResponse } from "../types/hrCapabilities";

const G = "#00a865";

export default function HomeScreen() {
  const { user, business, logout, refreshMe } = useAuth();
  const [caps, setCaps] = useState<HrCapabilitiesResponse | null>(null);
  const [capsError, setCapsError] = useState<string | null>(null);
  const [loadingCaps, setLoadingCaps] = useState(true);

  const loadCaps = useCallback(async () => {
    setCapsError(null);
    setLoadingCaps(true);
    try {
      const data = await fetchHrCapabilities();
      setCaps(data);
    } catch (e) {
      const msg =
        e instanceof PayHubApiError ? e.message : e instanceof Error ? e.message : "Could not load capabilities";
      setCapsError(msg);
      setCaps(null);
    } finally {
      setLoadingCaps(false);
    }
  }, []);

  useEffect(() => {
    void loadCaps();
  }, [loadCaps]);

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <Text style={styles.h1}>Signed in</Text>
      <Text style={styles.line}>{user?.fullName || user?.email || "—"}</Text>
      {business?.businessName ? (
        <Text style={styles.muted}>{business.businessName}</Text>
      ) : null}

      <Pressable style={styles.secondary} onPress={() => void refreshMe()}>
        <Text style={styles.secondaryText}>Refresh profile</Text>
      </Pressable>

      <Text style={styles.section}>HR capabilities</Text>
      <Text style={styles.hint}>Smoke test: same endpoint as web (`GET /api/hr/v1/capabilities`).</Text>

      {loadingCaps ? (
        <ActivityIndicator style={styles.spinner} color={G} />
      ) : capsError ? (
        <Text style={styles.error}>{capsError}</Text>
      ) : caps ? (
        <View style={styles.card}>
          <Text style={styles.mono}>
            attendance.checkins: {String(caps.data.attendance.checkins)}
          </Text>
          <Text style={styles.mono}>leaves.balances: {String(caps.data.leaves.balances)}</Text>
          <Text style={styles.mono}>payroll.slips: {String(caps.data.payroll.slips)}</Text>
          <Text style={styles.mono}>meta.source: {caps.meta?.source ?? "—"}</Text>
        </View>
      ) : null}

      <Pressable style={styles.secondary} onPress={() => void loadCaps()}>
        <Text style={styles.secondaryText}>Reload capabilities</Text>
      </Pressable>

      <Pressable style={styles.logout} onPress={() => void logout()}>
        <Text style={styles.logoutText}>Sign out</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: "#f5f6f5" },
  content: { padding: 20, paddingBottom: 40 },
  h1: { fontSize: 22, fontWeight: "700", color: "#1a1a1a", marginBottom: 8 },
  line: { fontSize: 16, color: "#374151" },
  muted: { fontSize: 14, color: "#6b7280", marginTop: 4 },
  section: { fontSize: 17, fontWeight: "700", marginTop: 28, marginBottom: 6, color: "#1a1a1a" },
  hint: { fontSize: 13, color: "#6b7280", marginBottom: 12 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(0,0,0,0.08)",
  },
  mono: { fontFamily: Platform.select({ ios: "Menlo", android: "monospace", default: undefined }), fontSize: 13, color: "#1a1a1a", marginBottom: 6 },
  spinner: { marginVertical: 16 },
  error: { color: "#dc2626", fontSize: 14, marginVertical: 8 },
  secondary: {
    alignSelf: "flex-start",
    marginTop: 16,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  secondaryText: { color: G, fontSize: 15, fontWeight: "600" },
  logout: {
    marginTop: 32,
    borderWidth: 1,
    borderColor: "#fca5a5",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  logoutText: { color: "#ef4444", fontSize: 16, fontWeight: "700" },
});
