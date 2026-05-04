import { useNavigate } from "react-router-dom";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { BottomNav } from "@/components/layout/BottomNav";
import { AppHeader } from "@/components/layout/AppHeader";
import { PageLayout } from "@/components/layout/PageLayout";
import { logoutUser } from "@/api/authApi";
import { getWorkspaces } from "@/api/memberApi";
import { useBudgetStore } from "@/store/budget";
import { useStorageStore } from "@/store/storage";
import { useTheme } from "@/hooks/useTheme";

export default function SettingsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { darkMode, toggle: toggleTheme } = useTheme();
  const resetStore = useBudgetStore((s) => s.resetStore);
  const user = useStorageStore((s) => s.user);
  const setUser = useStorageStore((s) => s.setUser);

  const { data: workspaces } = useQuery({
    queryKey: ["workspaces"],
    queryFn: () => getWorkspaces().then(res => res.data),
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
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="8" y1="6" x2="21" y2="6"></line>
                  <line x1="8" y1="12" x2="21" y2="12"></line>
                  <line x1="8" y1="18" x2="21" y2="18"></line>
                  <line x1="3" y1="6" x2="3.01" y2="6"></line>
                  <line x1="3" y1="12" x2="3.01" y2="12"></line>
                  <line x1="3" y1="18" x2="3.01" y2="18"></line>
                </svg>
              </div>
              <span className="font-medium" style={{ color: "var(--text-display)" }}>Kategori</span>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
          <button
            onClick={() => navigate("/settings/member")}
            className="w-full flex items-center justify-between p-4 hover:bg-[var(--surface-hover)] border border-[var(--border)] rounded-lg transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[var(--surface-hover)] flex items-center justify-center text-[var(--text-secondary)]">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
              </div>
              <span className="font-medium" style={{ color: "var(--text-display)" }}>Member</span>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
          
          {workspaces && workspaces.length > 1 && (
            <button
              onClick={() => window.dispatchEvent(new Event("open-workspace-modal"))}
              className="w-full flex items-center justify-between p-4 hover:bg-[var(--surface-hover)] border border-[var(--border)] rounded-lg transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[var(--surface-hover)] flex items-center justify-center text-[var(--text-secondary)]">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
                    <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
                    <path d="M12 11h4"></path>
                    <path d="M12 16h4"></path>
                    <path d="M8 11h.01"></path>
                    <path d="M8 16h.01"></path>
                  </svg>
                </div>
                <span className="font-medium" style={{ color: "var(--text-display)" }}>Ganti Workspace</span>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
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
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
              </div>
              <span
                className="font-medium"
                style={{ color: "var(--text-display)" }}
              >
                Riwayat Aktivitas
              </span>
            </div>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--text-secondary)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-between p-4 hover:bg-[var(--surface-hover)] border border-[var(--border)] rounded-lg transition-colors text-left cursor-pointer hover:bg-red-500/10"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  <polyline points="16 17 21 12 16 7"></polyline>
                  <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
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
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="16" x2="12" y2="12"></line>
                    <line x1="12" y1="8" x2="12.01" y2="8"></line>
                  </svg>
                </div>
                <span
                  className="font-medium"
                  style={{ color: "var(--text-display)" }}
                >
                  Tentang sesaKu
                </span>
              </div>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--text-secondary)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>
            <button className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors text-left">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[var(--surface)] flex items-center justify-center text-[var(--text-secondary)]">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                  </svg>
                </div>
                <span
                  className="font-medium"
                  style={{ color: "var(--text-display)" }}
                >
                  Bantuan & Dukungan
                </span>
              </div>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--text-secondary)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
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
