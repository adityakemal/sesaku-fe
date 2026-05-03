import { apiClient } from "./client";

export const getState = () => apiClient.get("/state");

export const saveState = (data: unknown) => apiClient.post("/state", data);

export const getBudget = () => apiClient.get("/budget");

export const saveDefaultBudget = (amount: number) =>
  apiClient.post("/budget", { type: "default", amount });

export const saveMonthlyBudget = (month: string, amount: number) =>
  apiClient.post("/budget", { type: "monthly", month, amount });
