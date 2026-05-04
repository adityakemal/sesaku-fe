import { apiClient } from "./client";

export const getState = () => apiClient.get("/state");

export const getBudget = () => apiClient.get("/budget");

export const saveMonthlyBudget = (entry: { id?: string; date?: string; amount: number; note?: string }) =>
  apiClient.post("/budget", entry);

export const updateBudget = (id: string, entry: { date?: string; amount: number; note?: string }) =>
  apiClient.put(`/budget/${id}`, entry);

export const deleteBudget = (id: string) =>
  apiClient.delete(`/budget/${id}`);
