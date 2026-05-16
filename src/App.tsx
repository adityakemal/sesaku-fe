import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Transaction from "./pages/Transaction";
import Income from "./pages/Income";
import Plan from "./pages/Plan";
import Settings from "./pages/Settings";
import SettingsCategory from "./pages/SettingsCategory";
import SettingsHistory from "./pages/SettingsHistory";
import SettingsMember from "./pages/SettingsMember";
import { checkSession } from "./api/authApi";
import { getCategories } from "./api/categoryApi";
import { useIncomeStore } from "./store/income";
import { useStorageStore } from "./store/storage";
import WorkspaceModal from "./components/WorkspaceModal";
import { LoadingPage } from "./components/layout/LoadingPage";

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { data, isLoading } = useQuery({
    queryKey: ["session"],
    queryFn: () => checkSession().then((res) => res.data),
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  const initStore = useIncomeStore((s) => s.initStore);
  const resetStore = useIncomeStore((s) => s.resetStore);
  const initialized = useIncomeStore((s) => s.initialized);
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

  if (isLoading) return <LoadingPage />;

  return data ? <>{children}</> : <Navigate to="/login" />;
}

function App() {
  const location = useLocation();
  const user = useStorageStore((s) => s.user);
  const [showWorkspace, setShowWorkspace] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // Check if we need to show the workspace selector on boot
  useEffect(() => {
    if (user && !localStorage.getItem("sesaku_workspace_id")) {
      setShowWorkspace(true);
    }
  }, [user]);

  // Listen to a custom event to open the modal from anywhere (e.g. Settings)
  useEffect(() => {
    const handleOpen = () => setShowWorkspace(true);
    window.addEventListener("open-workspace-modal", handleOpen);
    return () => window.removeEventListener("open-workspace-modal", handleOpen);
  }, []);

  return (
    <>
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
        path="/income"
        element={
          <PrivateRoute>
            <Income />
          </PrivateRoute>
        }
      />
      <Route
        path="/plan"
        element={
          <PrivateRoute>
            <Plan />
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
        path="/settings/member"
        element={
          <PrivateRoute>
            <SettingsMember />
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
      <WorkspaceModal isOpen={showWorkspace} onClose={() => setShowWorkspace(false)} />
    </>
  );
}

export default App;
