import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  fetchExpensesPendingApproval,
  fetchExpensesReadyToPay,
  fetchLeaveApplications,
  postExpenseClaimApprove,
  postExpenseClaimMarkPaid,
  postExpenseClaimReject,
  postLeaveApplicationApprove,
  postLeaveApplicationReject,
  type ExpenseClaimRow,
  type LeaveApplicationRow,
} from "../api/hr";
import { useAuth } from "../context/AuthContext";
import { PayHubApiError } from "../lib/payhubFetch";

const G = "#00a865";

type ApprovalsTab = "leave" | "expense";

type ExpenseQueueTab = "pending" | "payout";

type RejectTarget = { tab: ApprovalsTab; id: string } | null;

function leaveRowId(row: LeaveApplicationRow): string {
  return typeof row.name === "string" && row.name.trim() ? row.name.trim() : "";
}

function expenseRowId(row: ExpenseClaimRow): string {
  return typeof row.name === "string" && row.name.trim() ? row.name.trim() : "";
}

function formatMoney(v: number | string | null | undefined): string {
  const n = Number.parseFloat(String(v ?? ""));
  if (!Number.isFinite(n)) return "—";
  return `KES ${n.toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function AdminApprovalsScreen() {
  const { canSubmitOnBehalf } = useAuth();
  const [tab, setTab] = useState<ApprovalsTab>("leave");
  const [expenseQueue, setExpenseQueue] = useState<ExpenseQueueTab>("pending");

  const [leaveRows, setLeaveRows] = useState<LeaveApplicationRow[]>([]);
  const [expenseRows, setExpenseRows] = useState<ExpenseClaimRow[]>([]);
  const [payoutRows, setPayoutRows] = useState<ExpenseClaimRow[]>([]);

  const [loadingLeave, setLoadingLeave] = useState(true);
  const [loadingExpense, setLoadingExpense] = useState(false);
  const [loadingPayout, setLoadingPayout] = useState(false);
  const [errorLeave, setErrorLeave] = useState<string | null>(null);
  const [errorExpense, setErrorExpense] = useState<string | null>(null);
  const [errorPayout, setErrorPayout] = useState<string | null>(null);

  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<RejectTarget>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [markPaidFor, setMarkPaidFor] = useState<string | null>(null);
  const [paymentRef, setPaymentRef] = useState("");
  const [paymentMode, setPaymentMode] = useState<"wallet" | "offline">("wallet");

  const loadLeave = useCallback(async () => {
    setLoadingLeave(true);
    setErrorLeave(null);
    try {
      const res = await fetchLeaveApplications(1, 40, "pending");
      setLeaveRows(res.data ?? []);
    } catch (e) {
      const msg =
        e instanceof PayHubApiError ? e.message : e instanceof Error ? e.message : "Failed to load leave";
      setErrorLeave(msg);
    } finally {
      setLoadingLeave(false);
    }
  }, []);

  const loadExpense = useCallback(async () => {
    setLoadingExpense(true);
    setErrorExpense(null);
    try {
      const res = await fetchExpensesPendingApproval(1, 40);
      setExpenseRows(res.data ?? []);
    } catch (e) {
      const msg =
        e instanceof PayHubApiError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Failed to load expenses";
      setErrorExpense(msg);
    } finally {
      setLoadingExpense(false);
    }
  }, []);

  const loadExpensePayout = useCallback(async () => {
    setLoadingPayout(true);
    setErrorPayout(null);
    try {
      const res = await fetchExpensesReadyToPay(1, 40);
      setPayoutRows(res.data ?? []);
    } catch (e) {
      const msg =
        e instanceof PayHubApiError ? e.message : e instanceof Error ? e.message : "Failed to load queue";
      setErrorPayout(msg);
    } finally {
      setLoadingPayout(false);
    }
  }, []);

  useEffect(() => {
    void loadLeave();
  }, [loadLeave]);

  useEffect(() => {
    if (!canSubmitOnBehalf && expenseQueue === "payout") setExpenseQueue("pending");
  }, [canSubmitOnBehalf, expenseQueue]);

  useEffect(() => {
    if (tab !== "expense") return;
    if (expenseQueue === "pending") void loadExpense();
    else void loadExpensePayout();
  }, [tab, expenseQueue, loadExpense, loadExpensePayout]);

  const onApproveLeave = useCallback(
    (id: string) => {
      Alert.alert("Approve leave", "Mark this application as approved?", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Approve",
          onPress: () => {
            void (async () => {
              const key = `leave:${id}`;
              setBusyKey(key);
              try {
                await postLeaveApplicationApprove(id);
                await loadLeave();
              } catch (e) {
                const msg =
                  e instanceof PayHubApiError
                    ? e.message
                    : e instanceof Error
                      ? e.message
                      : "Approve failed";
                Alert.alert("Could not approve", msg);
              } finally {
                setBusyKey(null);
              }
            })();
          },
        },
      ]);
    },
    [loadLeave]
  );

  const onApproveExpense = useCallback(
    (id: string) => {
      Alert.alert("Approve expense", "Approve this expense claim?", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Approve",
          onPress: () => {
            void (async () => {
              const key = `expense:${id}`;
              setBusyKey(key);
              try {
                await postExpenseClaimApprove(id);
                await loadExpense();
              } catch (e) {
                const msg =
                  e instanceof PayHubApiError
                    ? e.message
                    : e instanceof Error
                      ? e.message
                      : "Approve failed";
                Alert.alert("Could not approve", msg);
              } finally {
                setBusyKey(null);
              }
            })();
          },
        },
      ]);
    },
    [loadExpense]
  );

  const submitReject = useCallback(async () => {
    if (!rejectTarget) return;
    const { tab: rt, id } = rejectTarget;
    const key = `${rt}:${id}`;
    setBusyKey(key);
    try {
      if (rt === "leave") {
        await postLeaveApplicationReject(id, rejectReason);
        await loadLeave();
      } else {
        await postExpenseClaimReject(id, rejectReason);
        await loadExpense();
      }
      setRejectTarget(null);
      setRejectReason("");
    } catch (e) {
      const msg =
        e instanceof PayHubApiError ? e.message : e instanceof Error ? e.message : "Reject failed";
      Alert.alert("Could not reject", msg);
    } finally {
      setBusyKey(null);
    }
  }, [rejectTarget, rejectReason, loadLeave, loadExpense]);

  const submitMarkPaid = useCallback(async () => {
    if (!markPaidFor) return;
    const id = markPaidFor;
    const key = `markpaid:${id}`;
    setBusyKey(key);
    try {
      await postExpenseClaimMarkPaid(id, {
        payment_ref: paymentRef,
        payment_mode: paymentMode,
      });
      setMarkPaidFor(null);
      setPaymentRef("");
      setPaymentMode("wallet");
      await loadExpensePayout();
    } catch (e) {
      const msg =
        e instanceof PayHubApiError ? e.message : e instanceof Error ? e.message : "Could not mark paid";
      Alert.alert("Could not mark paid", msg);
    } finally {
      setBusyKey(null);
    }
  }, [markPaidFor, paymentRef, paymentMode, loadExpensePayout]);

  const expenseListData = expenseQueue === "pending" ? expenseRows : payoutRows;
  const expenseListLoading = expenseQueue === "pending" ? loadingExpense : loadingPayout;
  const expenseListError = expenseQueue === "pending" ? errorExpense : errorPayout;

  const reloadExpenseList = useCallback(() => {
    if (expenseQueue === "pending") void loadExpense();
    else void loadExpensePayout();
  }, [expenseQueue, loadExpense, loadExpensePayout]);

  return (
    <View style={styles.root}>
      <View style={styles.segment}>
        <Pressable
          style={[styles.segmentBtn, tab === "leave" && styles.segmentBtnActive]}
          onPress={() => setTab("leave")}
        >
          <Text style={[styles.segmentLabel, tab === "leave" && styles.segmentLabelActive]}>Leave</Text>
        </Pressable>
        <Pressable
          style={[styles.segmentBtn, tab === "expense" && styles.segmentBtnActive]}
          onPress={() => setTab("expense")}
        >
          <Text style={[styles.segmentLabel, tab === "expense" && styles.segmentLabelActive]}>Expenses</Text>
        </Pressable>
      </View>

      {tab === "leave" ? (
        <FlatList
          style={styles.list}
          contentContainerStyle={styles.content}
          data={leaveRows}
          keyExtractor={(item, i) => leaveRowId(item) || `leave-${i}`}
          refreshControl={
            <RefreshControl
              refreshing={loadingLeave && leaveRows.length > 0}
              onRefresh={() => void loadLeave()}
              tintColor={G}
            />
          }
          ListHeaderComponent={
            <View>
              <Text style={styles.title}>Pending leave</Text>
              <Text style={styles.sub}>Applications waiting for action (HR / approver).</Text>
              {loadingLeave && leaveRows.length === 0 ? (
                <ActivityIndicator style={styles.spinner} color={G} />
              ) : null}
              {errorLeave ? <Text style={styles.err}>{errorLeave}</Text> : null}
            </View>
          }
          ListEmptyComponent={
            !loadingLeave ? <Text style={styles.empty}>No pending leave applications.</Text> : null
          }
          renderItem={({ item }) => {
            const id = leaveRowId(item);
            const key = id ? `leave:${id}` : "";
            const disabled = !id || busyKey === key;
            return (
              <View style={styles.card}>
                <Text style={styles.emp}>{item.employee_name ?? item.employee ?? "—"}</Text>
                <Text style={styles.type}>{item.leave_type ?? "Leave"}</Text>
                <Text style={styles.dates}>
                  {item.from_date ?? "?"} → {item.to_date ?? "?"}
                  {item.total_leave_days != null ? ` · ${item.total_leave_days} day(s)` : ""}
                </Text>
                {id ? (
                  <View style={styles.actions}>
                    <Pressable
                      style={[styles.btn, styles.btnApprove, disabled && styles.btnDisabled]}
                      onPress={() => onApproveLeave(id)}
                      disabled={disabled}
                    >
                      <Text style={styles.btnApproveText}>{busyKey === key ? "…" : "Approve"}</Text>
                    </Pressable>
                    <Pressable
                      style={[styles.btn, styles.btnReject, disabled && styles.btnDisabled]}
                      onPress={() => {
                        setRejectTarget({ tab: "leave", id });
                        setRejectReason("");
                      }}
                      disabled={disabled}
                    >
                      <Text style={styles.btnRejectText}>Reject</Text>
                    </Pressable>
                  </View>
                ) : (
                  <Text style={styles.warn}>Missing document id — cannot act.</Text>
                )}
              </View>
            );
          }}
        />
      ) : (
        <FlatList
          style={styles.list}
          contentContainerStyle={styles.content}
          data={expenseListData}
          keyExtractor={(item, i) => expenseRowId(item) || `exp-${expenseQueue}-${i}`}
          refreshControl={
            <RefreshControl
              refreshing={expenseListLoading && expenseListData.length > 0}
              onRefresh={reloadExpenseList}
              tintColor={G}
            />
          }
          ListHeaderComponent={
            <View>
              {canSubmitOnBehalf ? (
                <View style={styles.subSegment}>
                  <Pressable
                    style={[styles.subSegBtn, expenseQueue === "pending" && styles.subSegBtnActive]}
                    onPress={() => setExpenseQueue("pending")}
                  >
                    <Text
                      style={[styles.subSegLabel, expenseQueue === "pending" && styles.subSegLabelActive]}
                    >
                      Pending approval
                    </Text>
                  </Pressable>
                  <Pressable
                    style={[styles.subSegBtn, expenseQueue === "payout" && styles.subSegBtnActive]}
                    onPress={() => setExpenseQueue("payout")}
                  >
                    <Text style={[styles.subSegLabel, expenseQueue === "payout" && styles.subSegLabelActive]}>
                      Pay out
                    </Text>
                  </Pressable>
                </View>
              ) : null}
              <Text style={styles.title}>
                {expenseQueue === "pending" ? "Pending expenses" : "Ready to pay"}
              </Text>
              <Text style={styles.sub}>
                {expenseQueue === "pending"
                  ? "Submitted claims not yet approved or rejected. Finance sees the full company queue."
                  : "Approved claims with no reimbursement recorded yet. Marks paid in ERPNext (policy rules apply)."}
              </Text>
              {expenseListLoading && expenseListData.length === 0 ? (
                <ActivityIndicator style={styles.spinner} color={G} />
              ) : null}
              {expenseListError ? <Text style={styles.err}>{expenseListError}</Text> : null}
            </View>
          }
          ListEmptyComponent={
            !expenseListLoading ? (
              <Text style={styles.empty}>
                {expenseQueue === "pending" ? "No pending expense claims." : "Nothing in the pay-out queue."}
              </Text>
            ) : null
          }
          renderItem={({ item }) => {
            const id = expenseRowId(item);
            const amt =
              item.total_claimed_amount != null && String(item.total_claimed_amount).length > 0
                ? item.total_claimed_amount
                : item.grand_total;
            if (expenseQueue === "pending") {
              const key = id ? `expense:${id}` : "";
              const disabled = !id || busyKey === key;
              return (
                <View style={styles.card}>
                  <Text style={styles.emp}>{item.employee_name ?? item.employee ?? "—"}</Text>
                  <Text style={styles.type}>{formatMoney(amt)}</Text>
                  <Text style={styles.dates}>
                    Claim {item.name ?? "—"}
                    {item.posting_date ? ` · ${item.posting_date}` : ""}
                    {item.approval_status ? ` · ${item.approval_status}` : ""}
                  </Text>
                  {id ? (
                    <View style={styles.actions}>
                      <Pressable
                        style={[styles.btn, styles.btnApprove, disabled && styles.btnDisabled]}
                        onPress={() => onApproveExpense(id)}
                        disabled={disabled}
                      >
                        <Text style={styles.btnApproveText}>{busyKey === key ? "…" : "Approve"}</Text>
                      </Pressable>
                      <Pressable
                        style={[styles.btn, styles.btnReject, disabled && styles.btnDisabled]}
                        onPress={() => {
                          setRejectTarget({ tab: "expense", id });
                          setRejectReason("");
                        }}
                        disabled={disabled}
                      >
                        <Text style={styles.btnRejectText}>Reject</Text>
                      </Pressable>
                    </View>
                  ) : (
                    <Text style={styles.warn}>Missing document id — cannot act.</Text>
                  )}
                </View>
              );
            }
            const pkey = id ? `markpaid:${id}` : "";
            const pDisabled = !id || busyKey === pkey;
            return (
              <View style={styles.card}>
                <Text style={styles.emp}>{item.employee_name ?? item.employee ?? "—"}</Text>
                <Text style={styles.type}>{formatMoney(amt)}</Text>
                <Text style={styles.dates}>
                  Claim {item.name ?? "—"}
                  {item.posting_date ? ` · ${item.posting_date}` : ""}
                  {item.approval_status ? ` · ${item.approval_status}` : ""}
                </Text>
                {id ? (
                  <Pressable
                    style={[styles.btnFull, styles.btnMarkPaid, pDisabled && styles.btnDisabled]}
                    onPress={() => {
                      setMarkPaidFor(id);
                      setPaymentRef("");
                      setPaymentMode("wallet");
                    }}
                    disabled={pDisabled}
                  >
                    <Text style={styles.btnMarkPaidText}>{busyKey === pkey ? "…" : "Mark paid"}</Text>
                  </Pressable>
                ) : (
                  <Text style={styles.warn}>Missing document id — cannot act.</Text>
                )}
              </View>
            );
          }}
        />
      )}

      {rejectTarget ? (
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>
              {rejectTarget.tab === "leave" ? "Reject leave" : "Reject expense claim"}
            </Text>
            <Text style={styles.modalHint}>Optional note (stored on the document where supported)</Text>
            <TextInput
              style={styles.input}
              value={rejectReason}
              onChangeText={setRejectReason}
              placeholder="Reason"
              placeholderTextColor="#9ca3af"
              multiline
            />
            <View style={styles.modalActions}>
              <Pressable
                style={[styles.btn, styles.btnGhost]}
                onPress={() => {
                  setRejectTarget(null);
                  setRejectReason("");
                }}
              >
                <Text style={styles.btnGhostText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.btn, styles.btnRejectSolid]}
                onPress={() => void submitReject()}
                disabled={busyKey !== null}
              >
                <Text style={styles.btnRejectSolidText}>{busyKey ? "…" : "Reject"}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      ) : null}

      {markPaidFor ? (
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Mark expense paid</Text>
            <Text style={styles.modalHint}>
              Records reimbursement on the claim. Pay Hub defaults paid date to today when omitted.
            </Text>
            <Text style={styles.fieldLabel}>Payment mode</Text>
            <View style={styles.modeRow}>
              <Pressable
                style={[styles.modeChip, paymentMode === "wallet" && styles.modeChipActive]}
                onPress={() => setPaymentMode("wallet")}
              >
                <Text style={[styles.modeChipText, paymentMode === "wallet" && styles.modeChipTextActive]}>
                  Wallet
                </Text>
              </Pressable>
              <Pressable
                style={[styles.modeChip, paymentMode === "offline" && styles.modeChipActive]}
                onPress={() => setPaymentMode("offline")}
              >
                <Text style={[styles.modeChipText, paymentMode === "offline" && styles.modeChipTextActive]}>
                  Offline
                </Text>
              </Pressable>
            </View>
            <Text style={styles.fieldLabel}>Payment reference (optional)</Text>
            <TextInput
              style={styles.inputSingle}
              value={paymentRef}
              onChangeText={setPaymentRef}
              placeholder="e.g. M-Pesa confirmation code"
              placeholderTextColor="#9ca3af"
            />
            <View style={styles.modalActions}>
              <Pressable
                style={[styles.btn, styles.btnGhost]}
                onPress={() => {
                  setMarkPaidFor(null);
                  setPaymentRef("");
                  setPaymentMode("wallet");
                }}
              >
                <Text style={styles.btnGhostText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.btn, styles.btnMarkPaidSolid]}
                onPress={() => void submitMarkPaid()}
                disabled={busyKey !== null}
              >
                <Text style={styles.btnMarkPaidSolidText}>{busyKey ? "…" : "Confirm paid"}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f5f6f5" },
  segment: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 4,
    backgroundColor: "#e5e7eb",
    borderRadius: 12,
    padding: 4,
  },
  segmentBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: "center" },
  segmentBtnActive: { backgroundColor: "#fff" },
  segmentLabel: { fontSize: 14, fontWeight: "600", color: "#6b7280" },
  segmentLabelActive: { color: "#1a1a1a" },
  subSegment: {
    flexDirection: "row",
    marginBottom: 14,
    backgroundColor: "#e5e7eb",
    borderRadius: 10,
    padding: 3,
  },
  subSegBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: "center" },
  subSegBtnActive: { backgroundColor: "#fff" },
  subSegLabel: { fontSize: 12, fontWeight: "600", color: "#6b7280" },
  subSegLabelActive: { color: "#1a1a1a" },
  list: { flex: 1 },
  content: { padding: 20, paddingTop: 8, paddingBottom: 40 },
  title: { fontSize: 22, fontWeight: "700", color: "#1a1a1a" },
  sub: { fontSize: 14, color: "#6b7280", marginTop: 6, marginBottom: 12 },
  spinner: { marginVertical: 20 },
  err: { color: "#dc2626", marginBottom: 12 },
  empty: { fontSize: 14, color: "#9ca3af", marginTop: 12 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(0,0,0,0.08)",
  },
  emp: { fontSize: 17, fontWeight: "700", color: "#1a1a1a" },
  type: { fontSize: 15, color: G, fontWeight: "600", marginTop: 4 },
  dates: { fontSize: 14, color: "#6b7280", marginTop: 6 },
  actions: { flexDirection: "row", marginTop: 14, gap: 10 },
  btnFull: { marginTop: 14, paddingVertical: 12, borderRadius: 12, alignItems: "center" },
  btnMarkPaid: { backgroundColor: "rgba(37,99,235,0.12)" },
  btnMarkPaidText: { color: "#2563eb", fontWeight: "700" },
  btn: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: "center" },
  btnApprove: { backgroundColor: "rgba(0,168,101,0.12)" },
  btnApproveText: { color: G, fontWeight: "700" },
  btnReject: { backgroundColor: "rgba(220,38,38,0.08)" },
  btnRejectText: { color: "#dc2626", fontWeight: "700" },
  btnDisabled: { opacity: 0.5 },
  warn: { color: "#b45309", marginTop: 8, fontSize: 13 },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    padding: 24,
  },
  modal: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: "700", color: "#1a1a1a" },
  modalHint: { fontSize: 13, color: "#6b7280", marginTop: 6 },
  fieldLabel: { fontSize: 12, fontWeight: "700", color: "#6b7280", marginTop: 14, textTransform: "uppercase" },
  modeRow: { flexDirection: "row", gap: 10, marginTop: 8 },
  modeChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
    backgroundColor: "#f3f4f6",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(0,0,0,0.08)",
  },
  modeChipActive: { backgroundColor: "rgba(37,99,235,0.12)", borderColor: "rgba(37,99,235,0.35)" },
  modeChipText: { fontSize: 14, fontWeight: "600", color: "#6b7280" },
  modeChipTextActive: { color: "#1d4ed8" },
  inputSingle: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(0,0,0,0.12)",
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
    fontSize: 15,
    color: "#1a1a1a",
  },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(0,0,0,0.12)",
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
    minHeight: 72,
    textAlignVertical: "top",
    fontSize: 15,
    color: "#1a1a1a",
  },
  modalActions: { flexDirection: "row", marginTop: 16, gap: 10 },
  btnGhost: { flex: 1, backgroundColor: "#f3f4f6" },
  btnGhostText: { fontWeight: "600", color: "#374151" },
  btnRejectSolid: { flex: 1, backgroundColor: "#dc2626" },
  btnRejectSolidText: { fontWeight: "700", color: "#fff" },
  btnMarkPaidSolid: { flex: 1, backgroundColor: "#2563eb" },
  btnMarkPaidSolidText: { fontWeight: "700", color: "#fff" },
});
