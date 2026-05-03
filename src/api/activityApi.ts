import { apiClient } from "./client";

export interface ActivityLog {
  id: number;
  action: string;
  detail: string;
  status: string;
  created_at: string;
}

export interface ActivityPage {
  data: ActivityLog[];
  hasMore: boolean;
  nextCursor: number | null;
}

export const getActivity = (cursor?: number, limit = 20) =>
  apiClient.get<ActivityPage>("/activity", {
    params: cursor ? { cursor, limit } : { limit },
  });
