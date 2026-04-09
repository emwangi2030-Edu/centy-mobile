import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { fetchSalarySlipDetail, fetchSalarySlips, type SalarySlipRow } from "../api/hr";
import { fetchSelfServiceMe, pickEmployeeIdFromProfile } from "../api/selfService";
import { PayHubApiError } from "../lib/payhubFetch";
import { shareSalarySlipPdf } from "../lib/salarySlipPdf";

const G = "#00a865";

function fmtPeriod(row: SalarySlipRow): string {
  const a = String(row.start_date ?? "").slice(0, 10);
  const b = String(row.end_date ?? "").slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(a) && /^\d{4}-\d{2}-\d{2}$/.test(b)) return `${a} → ${b}`;
  return row.name ?? "—";
}

export default function PayslipsScreen() {
  const [preset, setPreset] = useState<"90" | "365">("365");
  const { fromDate, toDate } = useMemo(() => {
    const to = new Date().toISOString().slice(0, 10);
    const days = preset === "90" ? 90 : 365;
    const from = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);
    return { fromDate: from, toDate: to };
  }, [preset]);

  const [rows, setRows] = useState<SalarySlipRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [employeeHint, setEmployeeHint] = useState<string | null>(null);

  const [modalName, setModalName] = useState<string | null>(null);
  const [detail, setDetail] = useState<Record<string, unknown> | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [pdfBusy, setPdfBusy] = useState(false);

  const loadProfile = useCallback(async () => {
    try {
      const me = await fetchSelfServiceMe();
      const id = pickEmployeeIdFromProfile(me.data ?? undefined);
      setEmployeeHint(id ? `Employee: ${id}` : null);
    } catch {
      setEmployeeHint(null);
    }
  }, []);

  const loadList = useCallback(async () => {
    setError(null);
    try {
      const res = await fetchSalarySlips(fromDate, toDate, null);
      setRows(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      const msg =
        e instanceof PayHubApiError ? e.message : e instanceof Error ? e.message : "Failed to load payslips";
      setError(msg);
      setRows([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [fromDate, toDate]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    setLoading(true);
    void loadList();
  }, [loadList]);

  useEffect(() => {
    if (modalName == null || modalName === "") {
      setDetail(null);
      setDetailError(null);
      return;
    }
    const slipId: string = modalName;
    let cancelled = false;
    async function load() {
      setDetailLoading(true);
      setDetailError(null);
      try {
        const res = await fetchSalarySlipDetail(slipId);
        if (!cancelled) setDetail(res.data ?? null);
      } catch (e) {
        if (!cancelled) {
          const msg =
            e instanceof PayHubApiError ? e.message : e instanceof Error ? e.message : "Failed to load slip";
          setDetailError(msg);
          setDetail(null);
        }
      } finally {
        if (!cancelled) setDetailLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [modalName]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void loadList();
  }, [loadList]);

  async function onSharePdf() {
    if (!detail) return;
    setPdfBusy(true);
    try {
      await shareSalarySlipPdf(detail);
    } catch {
      /* user cancelled share is OK */
    } finally {
      setPdfBusy(false);
    }
  }

  const netPreview = detail
    ? String(detail.net_pay ?? detail.net_pay_amount ?? detail.rounded_total ?? "—")
    : "—";

  return (
    <View style={styles.container}>
      <View style={styles.toolbar}>
        <Text style={styles.toolbarLabel}>Period</Text>
        <View style={styles.chips}>
          <Pressable
            onPress={() => setPreset("90")}
            style={[styles.chip, preset === "90" && styles.chipOn]}
          >
            <Text style={[styles.chipTxt, preset === "90" && styles.chipTxtOn]}>90 days</Text>
          </Pressable>
          <Pressable
            onPress={() => setPreset("365")}
            style={[styles.chip, preset === "365" && styles.chipOn]}
          >
            <Text style={[styles.chipTxt, preset === "365" && styles.chipTxtOn]}>12 months</Text>
          </Pressable>
        </View>
        {employeeHint ? <Text style={styles.hint}>{employeeHint}</Text> : null}
      </View>

      {loading ? (
        <ActivityIndicator style={styles.centered} color={G} />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(item, i) => String(item.name ?? i)}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={G} />}
          ListEmptyComponent={<Text style={styles.empty}>No payslips in this period.</Text>}
          contentContainerStyle={rows.length === 0 ? styles.emptyBox : undefined}
          renderItem={({ item }) => (
            <Pressable style={styles.row} onPress={() => item.name && setModalName(item.name)}>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>{fmtPeriod(item)}</Text>
                <Text style={styles.rowSub}>
                  {item.status ? String(item.status) : "—"}
                  {item.currency ? ` · ${item.currency}` : ""}
                </Text>
              </View>
              <Text style={styles.chev}>›</Text>
            </Pressable>
          )}
        />
      )}

      <Modal visible={modalName !== null} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{modalName}</Text>
            {detailLoading ? (
              <ActivityIndicator color={G} style={{ marginVertical: 20 }} />
            ) : detailError ? (
              <Text style={styles.error}>{detailError}</Text>
            ) : detail ? (
              <ScrollView style={styles.modalScroll}>
                <Text style={styles.detailLine}>
                  Net pay: <Text style={styles.detailEm}>{netPreview}</Text>
                </Text>
                <Text style={styles.detailMuted}>
                  {String(detail.employee_name ?? "")} · {String(detail.start_date ?? "")} –{" "}
                  {String(detail.end_date ?? "")}
                </Text>
              </ScrollView>
            ) : null}

            <View style={styles.modalActions}>
              <Pressable
                style={[styles.btn, styles.btnGhost]}
                onPress={() => setModalName(null)}
              >
                <Text style={styles.btnGhostTxt}>Close</Text>
              </Pressable>
              <Pressable
                style={[styles.btn, styles.btnPrimary, (!detail || pdfBusy) && styles.btnDis]}
                onPress={() => void onSharePdf()}
                disabled={!detail || pdfBusy}
              >
                {pdfBusy ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.btnPrimaryTxt}>Share PDF</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f6f5" },
  toolbar: { padding: 16, paddingBottom: 8, backgroundColor: "#fff", borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "rgba(0,0,0,0.08)" },
  toolbarLabel: { fontSize: 12, fontWeight: "700", color: "#6b7280", marginBottom: 8 },
  chips: { flexDirection: "row", gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: "#f3f4f6" },
  chipOn: { backgroundColor: "#e4f5ec" },
  chipTxt: { fontSize: 13, fontWeight: "600", color: "#374151" },
  chipTxtOn: { color: G },
  hint: { fontSize: 11, color: "#9ca3af", marginTop: 8 },
  centered: { marginTop: 40 },
  error: { padding: 16, color: "#dc2626", fontSize: 14 },
  empty: { textAlign: "center", color: "#6b7280", fontSize: 15 },
  emptyBox: { flexGrow: 1, justifyContent: "center", padding: 24 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    marginHorizontal: 12,
    marginTop: 10,
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(0,0,0,0.06)",
  },
  rowTitle: { fontSize: 15, fontWeight: "700", color: "#1a1a1a" },
  rowSub: { fontSize: 13, color: "#6b7280", marginTop: 4 },
  chev: { fontSize: 22, color: "#d1d5db", marginLeft: 8 },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  modalCard: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: "88%",
  },
  modalTitle: { fontSize: 14, fontWeight: "700", color: "#374151", marginBottom: 12 },
  modalScroll: { maxHeight: 360 },
  detailLine: { fontSize: 16, color: "#1a1a1a", marginBottom: 6 },
  detailEm: { fontWeight: "800", color: G },
  detailMuted: { fontSize: 13, color: "#6b7280", lineHeight: 20 },
  modalActions: { flexDirection: "row", gap: 10, marginTop: 16 },
  btn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: "center" },
  btnGhost: { backgroundColor: "#f3f4f6" },
  btnGhostTxt: { fontWeight: "700", color: "#374151" },
  btnPrimary: { backgroundColor: G },
  btnPrimaryTxt: { fontWeight: "700", color: "#fff" },
  btnDis: { opacity: 0.6 },
});
