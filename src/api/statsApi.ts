import { apiClient } from "./client";

// ── Types ──────────────────────────────────────────────────────────────────

export interface DashboardSummary {
  totalBudget: number;
  totalTransaction: number;
  rangeTotal: number;
  rangeCount: number;
  dailyAvg: number;
  avgPerTx: number;
  topCategory: { name: string; total: number } | null;
}

export interface CategoryBreakdownItem {
  name: string;
  total: number;
  percent: number;
}

export interface SpendingTrendItem {
  day: string; // "YYYY-MM-DD"
  total: number;
}

export interface PlanSummary {
  planId: string;
  startDate: string;
  endDate: string;
  planTotal: number;
  planSpent: number;
  planRemaining: number;
  usagePercent: number;
  categories: { category: string; plan: number; actual: number }[];
  unbudgetedCategories?: { category: string; actual: number }[];
}

// ── API Calls ──────────────────────────────────────────────────────────────

const buildQs = (params?: { start?: string; end?: string }) => {
  const q = new URLSearchParams();
  if (params?.start) q.append("start", params.start);
  if (params?.end) q.append("end", params.end);
  const qs = q.toString();
  return qs ? `?${qs}` : "";
};

export const getDashboardSummary = (params?: { start?: string; end?: string }) =>
  apiClient.get<{ success: boolean; data: DashboardSummary }>(
    `/stats/dashboard${buildQs(params)}`
  );

export const getCategoryBreakdown = (params?: { start?: string; end?: string }) =>
  apiClient.get<{ success: boolean; data: CategoryBreakdownItem[] }>(
    `/stats/category-breakdown${buildQs(params)}`
  );

export const getSpendingTrend = (params?: { start?: string; end?: string }) =>
  apiClient.get<{ success: boolean; data: SpendingTrendItem[] }>(
    `/stats/spending-trend${buildQs(params)}`
  );

export const getPlanSummary = (planId: string) =>
  apiClient.get<{ success: boolean; data: PlanSummary }>(
    `/stats/plan-summary?planId=${planId}`
  );
