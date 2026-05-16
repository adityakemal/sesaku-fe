import { useNavigate } from "react-router-dom";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { BottomNav } from "@/components/layout/BottomNav";
import { AppHeader } from "@/components/layout/AppHeader";
import { PageLayout } from "@/components/layout/PageLayout";

import { LoadingPage } from "@/components/layout/LoadingPage";
import { logoutUser } from "@/api/authApi";
import { getWorkspaces } from "@/api/memberApi";
import { useIncomeStore } from "@/store/income";
import { useStorageStore } from "@/store/storage";
import { useTheme } from "@/hooks/useTheme";
import {
  LuChevronRight,
  LuTags,
  LuUsers,
  LuBuilding,
  LuHistory,
  LuLogOut,
  LuInfo,
  LuMessageCircle,
} from "react-icons/lu";

export default function SettingsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { darkMode, toggle: toggleTheme } = useTheme();
  const resetStore = useIncomeStore((s) => s.resetStore);
  const user = useStorageStore((s) => s.user);
  const setUser = useStorageStore((s) => s.setUser);

  const { data: workspaces, isLoading: workspacesLoading } = useQuery({
    queryKey: ["workspaces"],
    queryFn: () => getWorkspaces().then((res) => res.data),
    staleTime: 60 * 1000,
  });

  const handleLogout = async () => {
    await logoutUser();
    queryClient.clear();
    resetStore();
    setUser(null);
    localStorage.removeItem("sesaku_workspace_id");
    navigate("/login");
  };

  if (workspacesLoading && !workspaces) return <LoadingPage />;

  return (
    <PageLayout>
      <AppHeader title="Pengaturan" isShowDatepicker={false} />

      <div className="space-y-6 mt-6">
        {user && (
          <section
            className="p-4 rounded-xl flex items-center gap-4"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
            }}
          >
            {user.avatar ? (
              <img
                src={user.avatar}
                alt=""
                className="w-12 h-12 rounded-full flex-shrink-0"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div
                className="w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center text-[18px] font-bold"
                style={{ background: "var(--accent)", color: "white" }}
              >
                {user.name?.charAt(0)?.toUpperCase() || "?"}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p
                className="text-[15px] font-semibold truncate"
                style={{ color: "var(--text-display)" }}
              >
                {user.name}
              </p>
              <p
                className="text-[12px] truncate"
                style={{ color: "var(--text-secondary)" }}
              >
                {user.email}
              </p>
            </div>
            <button
              onClick={toggleTheme}
              className="w-9 h-9 flex items-center justify-center rounded-lg flex-shrink-0"
              style={{
                border: "1px solid var(--border-visible)",
                color: "var(--text-secondary)",
                background: "transparent",
              }}
            >
              {darkMode ? "☀" : "☾"}
            </button>
          </section>
        )}

        <section className="space-y-3">
          <h2 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider pl-2">
            Manajemen
          </h2>
          <button
            onClick={() => navigate("/settings/category")}
            className="w-full flex items-center justify-between p-4 hover:bg-[var(--surface-hover)] border border-[var(--border)] rounded-lg transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[var(--surface-hover)] flex items-center justify-center text-[var(--text-secondary)]">
                <LuTags size={18} />
              </div>
              <span
                className="font-medium"
                style={{ color: "var(--text-display)" }}
              >
                Kategori
              </span>
            </div>
            <LuChevronRight size={16} color="var(--text-secondary)" />
          </button>
          <button
            onClick={() => navigate("/settings/member")}
            className="w-full flex items-center justify-between p-4 hover:bg-[var(--surface-hover)] border border-[var(--border)] rounded-lg transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[var(--surface-hover)] flex items-center justify-center text-[var(--text-secondary)]">
                <LuUsers size={18} />
              </div>
              <span
                className="font-medium"
                style={{ color: "var(--text-display)" }}
              >
                Member
              </span>
            </div>
            <LuChevronRight size={16} color="var(--text-secondary)" />
          </button>

          {workspaces && workspaces.length > 1 && (
            <button
              onClick={() =>
                window.dispatchEvent(new Event("open-workspace-modal"))
              }
              className="w-full flex items-center justify-between p-4 hover:bg-[var(--surface-hover)] border border-[var(--border)] rounded-lg transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[var(--surface-hover)] flex items-center justify-center text-[var(--text-secondary)]">
                  <LuBuilding size={18} />
                </div>
                <span
                  className="font-medium"
                  style={{ color: "var(--text-display)" }}
                >
                  Ganti Workspace
                </span>
              </div>
              <LuChevronRight size={16} color="var(--text-secondary)" />
            </button>
          )}
        </section>

        <section className="space-y-3">
          <h2 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider pl-2">
            Akun
          </h2>
          <button
            onClick={() => navigate("/settings/history")}
            className="w-full flex items-center justify-between p-4 hover:bg-[var(--surface-hover)] border border-[var(--border)] rounded-lg transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[var(--surface-hover)] flex items-center justify-center text-[var(--text-secondary)]">
                <LuHistory size={18} />
              </div>
              <span
                className="font-medium"
                style={{ color: "var(--text-display)" }}
              >
                Riwayat Aktivitas
              </span>
            </div>
            <LuChevronRight size={16} color="var(--text-secondary)" />
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-between p-4 hover:bg-[var(--surface-hover)] border border-[var(--border)] rounded-lg transition-colors text-left cursor-pointer hover:bg-red-500/10"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
                <LuLogOut size={18} />
              </div>
              <span className="font-medium text-red-500">Keluar</span>
            </div>
          </button>
        </section>

        <section className="space-y-3">
          <h2 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider pl-2">
            Informasi
          </h2>
          <div
            className="overflow-hidden divide-y divide-[var(--border)] rounded-xl"
            style={{ border: "1px solid var(--border)" }}
          >
            <button className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors text-left">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[var(--surface)] flex items-center justify-center text-[var(--text-secondary)]">
                  <LuInfo size={18} />
                </div>
                <span
                  className="font-medium"
                  style={{ color: "var(--text-display)" }}
                >
                  Tentang sesaKu
                </span>
              </div>
              <LuChevronRight size={16} color="var(--text-secondary)" />
            </button>
            <button className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors text-left">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[var(--surface)] flex items-center justify-center text-[var(--text-secondary)]">
                  <LuMessageCircle size={18} />
                </div>
                <span
                  className="font-medium"
                  style={{ color: "var(--text-display)" }}
                >
                  Bantuan & Dukungan
                </span>
              </div>
              <LuChevronRight size={16} color="var(--text-secondary)" />
            </button>
          </div>
        </section>

        <div className="text-center pt-8">
          <p className="text-xs text-[var(--text-secondary)]">sesaKu v1.0.0</p>
          <p className="text-xs text-[var(--text-secondary)] opacity-50">
            © 2026 Cubybot Studio
          </p>
        </div>
      </div>

      <BottomNav />
    </PageLayout>
  );
}
