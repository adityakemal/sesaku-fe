import axios from "axios";

// Create a configured axios instance
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  withCredentials: true, // Important for sending HttpOnly cookies
  headers: {
    "Content-Type": "application/json",
  },
});

// Response Interceptor
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
    
    // Reject the promise to trigger React Query's onError
    return Promise.reject(error);
  }
);
