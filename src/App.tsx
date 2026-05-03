import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Transaction from "./pages/Transaction";
import Budget from "./pages/Budget";
import Settings from "./pages/Settings";
import SettingsCategory from "./pages/SettingsCategory";
import SettingsHistory from "./pages/SettingsHistory";
import { checkSession } from "./api/authApi";
import { getCategories } from "./api/categoryApi";
import { useBudgetStore } from "./store/budget";
import { useStorageStore } from "./store/storage";

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { data, isLoading } = useQuery({
    queryKey: ["session"],
    queryFn: () => checkSession().then((res) => res.data),
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  const initStore = useBudgetStore((s) => s.initStore);
  const resetStore = useBudgetStore((s) => s.resetStore);
  const initialized = useBudgetStore((s) => s.initialized);
  const setUser = useStorageStore((s) => s.setUser);
  const setListCategory = useStorageStore((s) => s.setListCategory);

  useEffect(() => {
    if (data?.authenticated) {
      setUser({
        email: data.email,
        name: data.name,
        avatar: data.avatar || "",
      });
      if (!initialized) {
        getCategories()
          .then((res) => setListCategory(res.data))
          .catch(() => {});
        resetStore();
        initStore();
      }
    } else {
      resetStore();
      setUser(null);
      setListCategory([]);
    }
  }, [data, initialized]);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[var(--black)]"></div>
    );
  }

  return data ? <>{children}</> : <Navigate to="/login" />;
}

function App() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Home />
          </PrivateRoute>
        }
      />
      <Route
        path="/transaction"
        element={
          <PrivateRoute>
            <Transaction />
          </PrivateRoute>
        }
      />
      <Route
        path="/budget"
        element={
          <PrivateRoute>
            <Budget />
          </PrivateRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <PrivateRoute>
            <Settings />
          </PrivateRoute>
        }
      />
      <Route
        path="/settings/category"
        element={
          <PrivateRoute>
            <SettingsCategory />
          </PrivateRoute>
        }
      />
      <Route
        path="/settings/history"
        element={
          <PrivateRoute>
            <SettingsHistory />
          </PrivateRoute>
        }
      />
    </Routes>
  );
}

export default App;
