import { apiClient } from "./client";

export interface UserProfile {
  authenticated: boolean;
  sub: string;
  email: string;
  name: string;
  avatar: string;
}

export const checkSession = () =>
  apiClient.get<UserProfile>("/auth/me");

export const loginWithGoogle = (credential: string) =>
  apiClient.post("/auth/google", { credential });

export const logoutUser = () => apiClient.post("/auth/logout");
