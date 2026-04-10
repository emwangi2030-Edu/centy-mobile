import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { fetchRecentBatches, fetchWalletBalance, type BatchListRow } from "../api/wallet";
import type { AdminWalletStackParamList } from "../navigation/adminWalletStackTypes";
import { PayHubApiError } from "../lib/payhubFetch";

const G = "#00a865";

function formatKes(s: string | undefined | null): string {
  const n = Number.parseFloat(String(s ?? "0"));
  if (!Number.isFinite(n)) return "—";
  return `KES ${n.toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

type WalletNav = NativeStackNavigationProp<AdminWalletStackParamList, "WalletHome">;

export default function AdminWalletScreen() {
  const navigation = useNavigation<WalletNav>();
  const [balance, setBalance] = useState<Awaited<ReturnType<typeof fetchWalletBalance>> | null>(null);
  const [batches, setBatches] = useState<BatchListRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [w, b] = await Promise.all([fetchWalletBalance(), fetchRecentBatches(1, 10)]);
      setBalance(w);
      setBatches(b);
    } catch (e) {
      const msg =
        e instanceof PayHubApiError ? e.message : e instanceof Error ? e.message : "Failed to load wallet";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  const onRefresh = useCallback(() => {
    setLoading(true);
    void load();
  }, [load]);

  return (
    <FlatList
      style={styles.scroll}
      contentContainerStyle={styles.content}
      data={batches}
      keyExtractor={(item) => item.id}
      refreshControl={<RefreshControl refreshing={loading && !!balance} onRefresh={onRefresh} tintColor={G} />}
      ListHeaderComponent={
        <View>
          <Text style={styles.title}>Company wallet</Text>
          <Text style={styles.sub}>Pay Hub balance and recent disbursement batches.</Text>

          {loading && !balance ? (
            <ActivityIndicator style={styles.spinner} color={G} size="large" />
          ) : null}
          {error ? <Text style={styles.err}>{error}</Text> : null}

          {balance ? (
            <View style={styles.card}>
              <Text style={styles.cardLabel}>Available</Text>
              <Text style={styles.cardBig}>{formatKes(balance.effectiveAvailable)}</Text>
              <View style={styles.row}>
                <Text style={styles.muted}>Current</Text>
                <Text style={styles.val}>{formatKes(balance.currentBalance)}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.muted}>Reserved</Text>
                <Text style={styles.val}>{formatKes(balance.reservedDisbursements)}</Text>
              </View>
            </View>
          ) : null}

          <Text style={styles.section}>Recent batches</Text>
          <Text style={styles.hint}>Tap a batch for read-only details and line items.</Text>
        </View>
      }
      ListEmptyComponent={
        !loading && balance ? (
          <Text style={styles.empty}>No batches returned yet.</Text>
        ) : !loading && !balance ? null : loading ? (
          <Text style={styles.empty}>Loading…</Text>
        ) : null
      }
      renderItem={({ item }) => (
        <Pressable
          style={({ pressed }) => [styles.batchRow, pressed && styles.batchRowPressed]}
          onPress={() => navigation.navigate("BatchDetail", { batchId: item.id })}
          accessibilityRole="button"
          accessibilityLabel={`Batch ${item.name || item.id}`}
        >
          <Text style={styles.batchName} numberOfLines={1}>
            {item.name || item.id}
          </Text>
          <Text style={styles.batchMeta}>
            {(item.status ?? "—").toString()}
            {item.totalAmount != null ? ` · ${formatKes(item.totalAmount)}` : ""}
          </Text>
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: "#f5f6f5" },
  content: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 22, fontWeight: "700", color: "#1a1a1a" },
  sub: { fontSize: 14, color: "#6b7280", marginTop: 6, marginBottom: 16 },
  spinner: { marginVertical: 24 },
  err: { color: "#dc2626", marginBottom: 12 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(0,0,0,0.08)",
    marginBottom: 24,
  },
  cardLabel: { fontSize: 13, color: "#6b7280", fontWeight: "600" },
  cardBig: { fontSize: 28, fontWeight: "700", color: G, marginTop: 4, marginBottom: 12 },
  row: { flexDirection: "row", justifyContent: "space-between", marginTop: 6 },
  muted: { fontSize: 14, color: "#6b7280" },
  val: { fontSize: 14, fontWeight: "600", color: "#1a1a1a" },
  section: { fontSize: 13, fontWeight: "700", color: "#6b7280", textTransform: "uppercase", marginBottom: 6 },
  hint: { fontSize: 13, color: "#9ca3af", marginBottom: 10 },
  empty: { fontSize: 14, color: "#9ca3af", marginTop: 8 },
  batchRow: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(0,0,0,0.06)",
  },
  batchRowPressed: { opacity: 0.85 },
  batchName: { fontSize: 15, fontWeight: "600", color: "#1a1a1a" },
  batchMeta: { fontSize: 13, color: "#6b7280", marginTop: 4 },
});
