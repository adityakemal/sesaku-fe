import { apiClient } from "./client";
import type { Transaction } from "@/types";

export interface TransactionsPage {
  success: boolean;
  data: Transaction[];
  totalCount: number;
  totalAmount: number;
  hasMore: boolean;
  nextCursor: string | null;
}

export const getTransactions = (params?: { cursor?: string; limit?: number; start?: string; end?: string }) => {
  const q = new URLSearchParams();
  if (params?.cursor) q.append("cursor", params.cursor);
  if (params?.limit) q.append("limit", String(params.limit));
  if (params?.start) q.append("start", params.start);
  if (params?.end) q.append("end", params.end);
  const qs = q.toString();
  return apiClient.get<TransactionsPage>(`/transactions${qs ? `?${qs}` : ""}`);
};

export const createTransaction = (tx: Transaction) =>
  apiClient.post("/transactions", tx);

export const updateTransaction = (id: string, tx: Transaction) =>
  apiClient.put(`/transactions/${id}`, tx);

export const deleteTransaction = (id: string) =>
  apiClient.delete(`/transactions/${id}`);
