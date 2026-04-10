import { useRoute, type RouteProp } from "@react-navigation/native";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { fetchBatchDetail, fetchBatchItems, type BatchDetailResponse, type BatchItemRow } from "../api/wallet";
import type { AdminWalletStackParamList } from "../navigation/adminWalletStackTypes";
import { PayHubApiError } from "../lib/payhubFetch";

const G = "#00a865";

type Route = RouteProp<AdminWalletStackParamList, "BatchDetail">;

function formatKes(s: string | undefined | null): string {
  const n = Number.parseFloat(String(s ?? "0"));
  if (!Number.isFinite(n)) return "—";
  return `KES ${n.toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatWhen(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString();
}

export default function AdminBatchDetailScreen() {
  const { params } = useRoute<Route>();
  const batchId = params.batchId;

  const [batch, setBatch] = useState<BatchDetailResponse | null>(null);
  const [items, setItems] = useState<BatchItemRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [b, list] = await Promise.all([fetchBatchDetail(batchId), fetchBatchItems(batchId)]);
      setBatch(b);
      setItems(list);
    } catch (e) {
      const msg =
        e instanceof PayHubApiError ? e.message : e instanceof Error ? e.message : "Failed to load batch";
      setError(msg);
      setBatch(null);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [batchId]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={loading && !!batch} onRefresh={() => void load()} tintColor={G} />}
    >
      {loading && !batch ? <ActivityIndicator style={styles.spinner} color={G} size="large" /> : null}
      {error ? <Text style={styles.err}>{error}</Text> : null}

      {batch ? (
        <>
          <View style={styles.card}>
            <Text style={styles.kicker}>Batch</Text>
            <Text style={styles.mono} selectable>
              {batch.id}
            </Text>
            <View style={styles.row}>
              <Text style={styles.muted}>Status</Text>
              <Text style={styles.val}>{batch.status ?? "—"}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.muted}>Payment type</Text>
              <Text style={styles.val}>{batch.paymentType ?? "—"}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.muted}>Total</Text>
              <Text style={styles.valStrong}>{formatKes(batch.totalAmount)}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.muted}>Fees</Text>
              <Text style={styles.val}>{formatKes(batch.totalFees)}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.muted}>Recipients</Text>
              <Text style={styles.val}>
                {batch.completedCount ?? 0}/{batch.recipientCount ?? "—"} done
                {batch.failedCount != null && batch.failedCount > 0 ? ` · ${batch.failedCount} failed` : ""}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.muted}>Created</Text>
              <Text style={styles.val}>{formatWhen(batch.createdAt)}</Text>
            </View>
            {batch.createdByName ? (
              <View style={styles.row}>
                <Text style={styles.muted}>Created by</Text>
                <Text style={styles.val}>{batch.createdByName}</Text>
              </View>
            ) : null}
            {batch.batchType ? (
              <View style={styles.row}>
                <Text style={styles.muted}>Batch type</Text>
                <Text style={styles.val}>{batch.batchType}</Text>
              </View>
            ) : null}
            {batch.scheduledFor ? (
              <View style={styles.row}>
                <Text style={styles.muted}>Scheduled</Text>
                <Text style={styles.val}>{formatWhen(batch.scheduledFor)}</Text>
              </View>
            ) : null}
            {batch.heldReason ? (
              <View style={styles.holdBox}>
                <Text style={styles.holdTitle}>On hold</Text>
                <Text style={styles.holdText}>{batch.heldReason}</Text>
                {batch.heldByName ? <Text style={styles.holdMeta}>By {batch.heldByName}</Text> : null}
              </View>
            ) : null}
          </View>

          <Text style={styles.section}>Line items ({items.length})</Text>
          {items.length === 0 && !loading ? (
            <Text style={styles.empty}>No items in this batch.</Text>
          ) : null}
          {items.map((it) => (
            <View key={it.id} style={styles.itemCard}>
              <Text style={styles.itemRecipient} numberOfLines={2}>
                {it.recipient ?? "—"}
              </Text>
              <Text style={styles.itemAmt}>{formatKes(it.amount)}</Text>
              <Text style={styles.itemMeta}>
                {it.status ?? "—"}
                {it.systemRef ? ` · ${it.systemRef}` : ""}
                {it.reference ? ` · ref ${it.reference}` : ""}
              </Text>
              {it.processedAt ? (
                <Text style={styles.itemMeta}>Processed {formatWhen(it.processedAt)}</Text>
              ) : null}
              {it.failureReason ? (
                <Text style={styles.itemFail}>{it.failureReason}</Text>
              ) : null}
            </View>
          ))}
        </>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: "#f5f6f5" },
  content: { padding: 20, paddingBottom: 40 },
  spinner: { marginVertical: 24 },
  err: { color: "#dc2626", marginBottom: 12 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(0,0,0,0.08)",
    marginBottom: 20,
  },
  kicker: { fontSize: 12, fontWeight: "700", color: "#6b7280", textTransform: "uppercase" },
  mono: { fontSize: 13, color: "#374151", marginTop: 6, marginBottom: 12 },
  row: { flexDirection: "row", justifyContent: "space-between", marginTop: 8, gap: 12 },
  muted: { fontSize: 14, color: "#6b7280", flexShrink: 0 },
  val: { fontSize: 14, fontWeight: "600", color: "#1a1a1a", flex: 1, textAlign: "right" },
  valStrong: { fontSize: 16, fontWeight: "700", color: G, flex: 1, textAlign: "right" },
  holdBox: {
    marginTop: 14,
    padding: 12,
    backgroundColor: "#fffbeb",
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(180,83,9,0.25)",
  },
  holdTitle: { fontSize: 13, fontWeight: "700", color: "#92400e" },
  holdText: { fontSize: 14, color: "#78350f", marginTop: 4 },
  holdMeta: { fontSize: 12, color: "#a16207", marginTop: 4 },
  section: { fontSize: 13, fontWeight: "700", color: "#6b7280", textTransform: "uppercase", marginBottom: 10 },
  empty: { fontSize: 14, color: "#9ca3af" },
  itemCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(0,0,0,0.06)",
  },
  itemRecipient: { fontSize: 15, fontWeight: "600", color: "#1a1a1a" },
  itemAmt: { fontSize: 15, fontWeight: "700", color: G, marginTop: 6 },
  itemMeta: { fontSize: 13, color: "#6b7280", marginTop: 4 },
  itemFail: { fontSize: 13, color: "#dc2626", marginTop: 6 },
});
