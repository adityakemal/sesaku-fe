import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StoreInit } from "@/components/StoreInit";
import App from "./App.tsx";
import "./index.css";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Disable console.log if not localhost
if (window?.location?.hostname !== "localhost") {
  console.log = () => {};
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <StoreInit />
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 2000,
            style: {
              background: "#1a1a1a",
              color: "#fff",
              fontSize: "13px",
              borderRadius: "10px",
              border: "1px solid rgba(255,255,255,0.1)",
            },
          }}
        />
        <div className="w-full max-w-4xl mx-auto   bg-(--black) ">
          <App />
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
