import { useState, useMemo, useRef, useEffect } from "react";
import dayjs from "dayjs";
import toast from "react-hot-toast";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { getPlans, createPlan, deletePlan } from "@/api/planApi";
import { BottomNav } from "@/components/layout/BottomNav";
import { AppHeader } from "@/components/layout/AppHeader";
import { PageLayout } from "@/components/layout/PageLayout";
import { useTheme } from "@/hooks/useTheme";
import { useBudgetStore } from "@/store/budget";
import { useStorageStore } from "@/store/storage";
import { formatCurrency } from "@/utils";
import { CategorySelect } from "@/components/CategorySelect";
import { DateRangePicker } from "@/components/DatePicker";
import { PlanCard } from "@/components/plan/PlanCard";
import { PlanFormModal } from "@/components/plan/PlanFormModal";
import type { Plan as PlanType, PlanItem } from "@/types";

const PAGE_LIMIT = 15;

function formatNumber(value: string | number): string {
  const num = value.toString().replace(/[^0-9]/g, "");
  if (!num) return "";
  return new Intl.NumberFormat("id-ID").format(parseInt(num, 10));
}

export default function PlanPage() {
  const { mounted } = useTheme();
  const queryClient = useQueryClient();
  const allCategories = useStorageStore((s) => s.listCategory).map(
    (c) => c.name,
  );
  const { transactions } = useBudgetStore();

  // ── Data fetching ──────────────────────────────────────────────────────────
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useInfiniteQuery({
      queryKey: ["plans-paginated"],
      queryFn: async ({ pageParam }) => {
        const res = await getPlans({
          cursor: pageParam ?? undefined,
          limit: PAGE_LIMIT,
        });
        return res.data;
      },
      getNextPageParam: (lastPage) => {
        console.log("[InfiniteScroll] getNextPageParam called with:", lastPage);
        // Be resilient against different boolean formats or string 'true'
        const hasMore =
          lastPage.hasMore === true || String(lastPage.hasMore) === "true";
        return hasMore ? lastPage.nextCursor : undefined;
      },
      initialPageParam: null as string | null,
    });

  const allPlans = useMemo(
    () => data?.pages.flatMap((p) => p.data) ?? [],
    [data],
  );

  // Latest end date — drives the auto-start date for new plans
  const latestEndDate = useMemo(
    () =>
      allPlans
        .map((p) => p.end_date.split("T")[0])
        .sort()
        .at(-1) ?? null,
    [allPlans],
  );

  const minStartForNew = useMemo(() => {
    const oneMonthAgo = dayjs().subtract(1, "month").startOf("month");
    if (latestEndDate) {
      const nextAvailable = dayjs(latestEndDate).add(1, "day");
      return nextAvailable.isAfter(oneMonthAgo)
        ? nextAvailable.toDate()
        : oneMonthAgo.toDate();
    }
    return oneMonthAgo.toDate();
  }, [latestEndDate]);

  // ── Infinite scroll ────────────────────────────────────────────────────────
  const loadMoreRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        console.log("[InfiniteScroll] Observer fired:", {
          isIntersecting: entry.isIntersecting,
          hasNextPage,
          isFetchingNextPage,
        });
        if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
          console.log("[InfiniteScroll] Fetching next page...");
          fetchNextPage();
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Debug render
  useEffect(() => {
    console.log("[InfiniteScroll] Render state:", {
      hasNextPage,
      isFetchingNextPage,
      allPlansCount: allPlans.length,
    });
  }, [hasNextPage, isFetchingNextPage, allPlans.length]);

  // ── Local form state ───────────────────────────────────────────────────────
  const [showForm, setShowForm] = useState(false);
  const [deletingPlan, setDeletingPlan] = useState<PlanType | null>(null);
  const [editingPlan, setEditingPlan] = useState<PlanType | null>(null);

  const openForm = () => setShowForm(true);

  // ── Invalidate both queries (home page uses "plans", this page uses "plans-paginated")
  const invalidatePlans = () => {
    queryClient.invalidateQueries({ queryKey: ["plans-paginated"] });
    queryClient.invalidateQueries({ queryKey: ["plans"] });
  };

  // ── Mutations ──────────────────────────────────────────────────────────────
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deletePlan(id),
    onSuccess: () => {
      invalidatePlans();
      setDeletingPlan(null);
      toast.success("Plan dihapus");
    },
    onError: () => {
      setDeletingPlan(null);
      toast.error("Gagal menghapus plan");
    },
  });

  // ── Loading state ──────────────────────────────────────────────────────────
  if (!mounted || isLoading) {
    return (
      <div
        className="h-screen flex items-center justify-center"
        style={{ background: "var(--black)" }}
      >
        <div
          className="w-5 h-5 rounded-full"
          style={{
            border: "2px solid var(--accent)",
            borderTopColor: "transparent",
            animation: "spin 0.6s linear infinite",
          }}
        />
      </div>
    );
  }

  return (
    <PageLayout>
      <AppHeader
        title="Plan"
        isShowDatepicker={false}
        rightSlot={
          !showForm ? (
            <button
              onClick={openForm}
              className="text-[13px] font-semibold"
              style={{ color: "var(--accent)" }}
            >
              + Tambah Plan
            </button>
          ) : undefined
        }
      />

      <div className="pb-28 space-y-4">
        {/* ── Add / Edit Form Modal ────────────────────────────────────────── */}
        <PlanFormModal
          open={showForm || !!editingPlan}
          onClose={() => {
            setShowForm(false);
            setEditingPlan(null);
          }}
          editData={editingPlan}
          allPlans={allPlans}
          latestEndDate={latestEndDate}
        />

        {/* ── Plan list ──────────────────────────────────────────────────── */}
        {allPlans.length > 0 ? (
          <div className="space-y-3">
            {allPlans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                onDelete={setDeletingPlan}
                onEdit={setEditingPlan}
                isDeleting={deleteMutation.isPending}
              />
            ))}

            {/* Infinite scroll sentinel */}
            <div ref={loadMoreRef} className="py-3 flex justify-center">
              {isFetchingNextPage && (
                <div
                  className="w-4 h-4 rounded-full"
                  style={{
                    border: "2px solid var(--accent)",
                    borderTopColor: "transparent",
                    animation: "spin 0.6s linear infinite",
                  }}
                />
              )}
              {!hasNextPage && allPlans.length > PAGE_LIMIT && (
                <p
                  className="text-[11px]"
                  style={{ color: "var(--text-disabled)" }}
                >
                  Semua plan sudah ditampilkan
                </p>
              )}
            </div>
          </div>
        ) : (
          !showForm && (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <svg
                width="40"
                height="40"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--text-disabled)"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
              <p
                className="text-[13px]"
                style={{ color: "var(--text-disabled)" }}
              >
                Belum ada plan
              </p>
              <button
                onClick={openForm}
                className="h-10 px-5 text-[13px] font-bold rounded-xl"
                style={{ background: "var(--accent)", color: "white" }}
              >
                Buat Plan Pertama
              </button>
            </div>
          )
        )}
      </div>

      {/* ── Delete modal ───────────────────────────────────────────────────── */}
      {deletingPlan && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.6)" }}
          onClick={(e) => e.target === e.currentTarget && setDeletingPlan(null)}
        >
          <div
            className="w-full max-w-sm rounded-xl"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border-visible)",
            }}
          >
            <div
              className="p-4"
              style={{ borderBottom: "1px solid var(--border)" }}
            >
              <p
                className="text-[16px] font-semibold text-center"
                style={{ color: "var(--text-display)" }}
              >
                Hapus Plan
              </p>
            </div>
            <div className="p-5 text-center">
              <p
                className="text-[14px]"
                style={{ color: "var(--text-secondary)" }}
              >
                Yakin ingin menghapus plan{" "}
                <span className="font-bold" style={{ color: "var(--accent)" }}>
                  {dayjs(deletingPlan.start_date).format("DD MMM YYYY")} sampai{" "}
                  {dayjs(deletingPlan.end_date).format("DD MMM YYYY")}
                </span>
                ?
              </p>
            </div>
            <div
              className="p-4 flex gap-3"
              style={{ borderTop: "1px solid var(--border)" }}
            >
              <button
                onClick={() => deleteMutation.mutate(deletingPlan.id)}
                disabled={deleteMutation.isPending}
                className="flex-1 h-10 text-[13px] font-bold rounded-lg disabled:opacity-50"
                style={{
                  background: "var(--accent)",
                  color: "white",
                  border: "none",
                }}
              >
                {deleteMutation.isPending ? "Menghapus..." : "Hapus"}
              </button>
              <button
                onClick={() => setDeletingPlan(null)}
                disabled={deleteMutation.isPending}
                className="flex-1 h-10 text-[13px] rounded-lg disabled:opacity-50"
                style={{
                  border: "1px solid var(--border-visible)",
                  color: "var(--text-primary)",
                  background: "transparent",
                }}
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </PageLayout>
  );
}
