import { apiClient } from "./client";
import type { Transaction } from "@/types";

export const createTransaction = (tx: Transaction) =>
  apiClient.post("/transactions", tx);

export const updateTransaction = (id: string, tx: Transaction) =>
  apiClient.put(`/transactions/${id}`, tx);

export const deleteTransaction = (id: string) =>
  apiClient.delete(`/transactions/${id}`);
