import axios from "axios";

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  const workspaceId = localStorage.getItem("sesaku_workspace_id");
  if (workspaceId) {
    config.headers["x-workspace-id"] = workspaceId;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => {
    // Return the response data directly if needed, or just the response
    return response;
  },
  (error) => {
    // Handle 401 Unauthorized globally
    if (error.response?.status === 401) {
      // If we're not already on the login page, redirect
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    
    // Handle Forbidden Workspace
    if (error.response?.status === 403 || error.response?.data?.code === "WORKSPACE_FORBIDDEN") {
      localStorage.removeItem("sesaku_workspace_id");
      window.location.href = "/";
    }

    // Reject the promise to trigger React Query's onError
    return Promise.reject(error);
  }
);
