import { apiClient } from "./client";

export const getState = () => apiClient.get("/state");

export const getIncome = () => apiClient.get("/income");

export const saveMonthlyIncome = (entry: { id?: string; date?: string; amount: number; note?: string }) =>
  apiClient.post("/income", entry);

export const updateIncome = (id: string, entry: { date?: string; amount: number; note?: string }) =>
  apiClient.put(`/income/${id}`, entry);

export const deleteIncome = (id: string) =>
  apiClient.delete(`/income/${id}`);
