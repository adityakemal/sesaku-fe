import { apiClient } from "./client";
import type { Plan } from "@/types";

export interface PlansPage {
  success: boolean;
  data: Plan[];
  hasMore: boolean;
  nextCursor: string | null;
}

export const getPlans = (params?: { cursor?: string; limit?: number }) => {
  const q = new URLSearchParams();
  if (params?.cursor) q.append("cursor", params.cursor);
  if (params?.limit) q.append("limit", String(params.limit));
  const qs = q.toString();
  return apiClient.get<PlansPage>(`/plans${qs ? `?${qs}` : ""}`);
};

export const createPlan = (data: Partial<Plan>) =>
  apiClient.post<{ success: boolean; data: Plan }>("/plans", data);

export const updatePlan = (id: string, data: Partial<Plan>) =>
  apiClient.put<{ success: boolean; data: Plan }>(`/plans/${id}`, data);

export const deletePlan = (id: string) =>
  apiClient.delete<{ success: boolean; message: string }>(`/plans/${id}`);

export const seedDevPlans = () =>
  apiClient.post<{ success: boolean; message: string }>("/plans/dev/seed", {});
