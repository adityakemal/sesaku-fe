import { apiClient } from "./client";

export const getMembers = () => apiClient.get("/workspace/members");

export const getWorkspaces = () => apiClient.get("/workspace/spaces");

export const inviteMember = (email: string) =>
  apiClient.post("/workspace/members", { email });

export const removeMember = (email: string) =>
  apiClient.delete(`/workspace/members/${encodeURIComponent(email)}`);
