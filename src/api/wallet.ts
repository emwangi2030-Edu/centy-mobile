import { payhubFetchJson, type PayhubFetchOptions } from "../lib/payhubFetch";

const OPT: PayhubFetchOptions = { timeoutMs: 60_000 };

export type WalletBalanceResponse = {
  currentBalance: string;
  reservedDisbursements: string;
  availableBalance: string;
  overdraftLimit: string | null;
  overdraftUsed: string;
  overdraftRemaining: string;
  effectiveAvailable: string;
  overdraftDrawnAt: string | null;
  hasApprovedCashAdvance: boolean;
};

export async function fetchWalletBalance(): Promise<WalletBalanceResponse> {
  return payhubFetchJson<WalletBalanceResponse>("/api/batches/wallet-balance", OPT);
}

export type BatchListRow = {
  id: string;
  name?: string | null;
  status?: string | null;
  totalAmount?: string | null;
  createdAt?: string | null;
};

type PaginatedBatches = {
  data: BatchListRow[];
  page?: number;
  pageSize?: number;
};

export async function fetchRecentBatches(page = 1, limit = 8): Promise<BatchListRow[]> {
  const q = new URLSearchParams({ page: String(page), limit: String(limit) });
  const raw = await payhubFetchJson<BatchListRow[] | PaginatedBatches>(`/api/batches?${q}`, OPT);
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === "object" && Array.isArray(raw.data)) return raw.data;
  return [];
}

/** Pay Hub `BulkPaymentBatch` (read-only mobile). */
export type BatchDetailResponse = {
  id: string;
  paymentType?: string;
  status?: string;
  totalAmount?: string;
  totalFees?: string;
  recipientCount?: number;
  completedCount?: number | null;
  failedCount?: number | null;
  createdByName?: string | null;
  createdByUserId?: string | null;
  batchType?: string | null;
  scheduledFor?: string | null;
  processedAt?: string | null;
  createdAt?: string | null;
  heldReason?: string | null;
  heldByName?: string | null;
};

export async function fetchBatchDetail(batchId: string): Promise<BatchDetailResponse> {
  const enc = encodeURIComponent(batchId);
  return payhubFetchJson<BatchDetailResponse>(`/api/batches/${enc}`, OPT);
}

export type BatchItemRow = {
  id: string;
  recipient?: string;
  accountNumber?: string | null;
  amount?: string;
  fee?: string;
  reference?: string | null;
  status?: string;
  failureReason?: string | null;
  processedAt?: string | null;
  systemRef?: string | null;
};

export async function fetchBatchItems(batchId: string): Promise<BatchItemRow[]> {
  const enc = encodeURIComponent(batchId);
  const raw = await payhubFetchJson<BatchItemRow[]>(`/api/batches/${enc}/items`, OPT);
  return Array.isArray(raw) ? raw : [];
}
