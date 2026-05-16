import { useRef, useEffect } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { AppHeader } from "@/components/layout/AppHeader";
import { BottomNav } from "@/components/layout/BottomNav";
import { PageLayout } from "@/components/layout/PageLayout";
import { LoadingPage } from "@/components/layout/LoadingPage";
import { getActivity, type ActivityLog } from "@/api/activityApi";
import dayjs from "dayjs";

function getActionIcon(action: string): string {
  if (action === "login") return "🔑";
  if (action === "logout") return "🚪";
  if (action.includes("POST")) return "➕";
  if (action.includes("PUT")) return "✏️";
  if (action.includes("DELETE")) return "🗑️";
  return "📌";
}

function getActionLabel(action: string): string {
  if (action === "login") return "Login";
  if (action === "logout") return "Logout";
  if (action.includes("kategori"))
    return action.replace("kategori", "Kategori");
  if (action.includes("transaksi"))
    return action.replace("transaksi", "Transaksi");
  if (action.includes("budget")) return action.replace("budget", "Budget");
  return action;
}

export default function SettingsHistory() {
  const sentinelRef = useRef<HTMLDivElement>(null);

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: ["activity"],
      queryFn: ({ pageParam }) =>
        getActivity(pageParam).then((res) => res.data),
      getNextPageParam: (lastPage) =>
        lastPage.hasMore ? lastPage.nextCursor : undefined,
      initialPageParam: undefined as number | undefined,
    });

  const logs: ActivityLog[] = data?.pages.flatMap((page) => page.data) ?? [];

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isLoading) return <LoadingPage />;

  return (
    <PageLayout>
      <AppHeader title="Riwayat Aktivitas" isShowDatepicker={false} />

      {logs.length === 0 ? (
        <div
          className="text-center py-12 rounded-xl"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
          }}
        >
          <div className="text-[40px] mb-3">📭</div>
          <p className="text-[14px]" style={{ color: "var(--text-disabled)" }}>
            Belum ada aktivitas
          </p>
          <p
            className="text-[12px] mt-1"
            style={{ color: "var(--text-disabled)" }}
          >
            Aktivitas akan tercatat saat kamu mulai menggunakan sesaKu
          </p>
        </div>
      ) : (
        <div className="relative pl-6">
          <div
            className="absolute left-[11px] top-2 bottom-2 w-px"
            style={{ background: "var(--border-visible)" }}
          />
          <div className="space-y-4">
            {logs.map((log) => (
              <div key={log.id} className="relative">
                <div
                  className="absolute -left-[23px] top-1.5 w-5 h-5 rounded-full flex items-center justify-center text-[11px]"
                  style={{
                    background:
                      log.status === "error"
                        ? "rgba(215,25,33,0.15)"
                        : "var(--surface-raised)",
                    border: `1px solid ${log.status === "error" ? "var(--accent)" : "var(--border-visible)"}`,
                  }}
                >
                  <span className="leading-none">
                    {getActionIcon(log.action)}
                  </span>
                </div>
                <div
                  className="p-3 rounded-xl"
                  style={{
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className="text-[13px] font-medium"
                      style={{ color: "var(--text-display)" }}
                    >
                      {getActionLabel(log.action)}
                    </span>
                    {log.status === "error" ? (
                      <span
                        className="px-1.5 py-0.5 rounded text-[10px] font-bold"
                        style={{ background: "var(--accent)", color: "white" }}
                      >
                        GAGAL
                      </span>
                    ) : (
                      <span
                        className="px-1.5 py-0.5 rounded text-[10px] font-bold"
                        style={{
                          background: "rgba(74,158,92,0.15)",
                          color: "var(--success)",
                        }}
                      >
                        OK
                      </span>
                    )}
                  </div>
                  {log.detail && (
                    <p
                      className="text-[11px] mt-1 truncate"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {log.detail}
                    </p>
                  )}
                  <p
                    className="text-[10px] mt-1.5"
                    style={{ color: "var(--text-disabled)" }}
                  >
                    {dayjs(log.created_at).format("DD MMM YYYY • HH:mm")}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div
            ref={sentinelRef}
            className="flex items-center justify-center py-6"
          >
            {isFetchingNextPage ? (
              <div
                className="w-5 h-5 rounded-full"
                style={{
                  border: "2px solid var(--accent)",
                  borderTopColor: "transparent",
                  animation: "spin 0.6s linear infinite",
                }}
              />
            ) : hasNextPage ? (
              <p
                className="text-[11px]"
                style={{ color: "var(--text-disabled)" }}
              >
                Scroll untuk memuat...
              </p>
            ) : (
              <p
                className="text-[11px]"
                style={{ color: "var(--text-disabled)" }}
              >
                — Semua aktivitas telah dimuat —
              </p>
            )}
          </div>
        </div>
      )}

      <BottomNav />
    </PageLayout>
  );
}
