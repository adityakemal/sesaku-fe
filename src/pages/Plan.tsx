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
import type { Plan as PlanType, PlanItem } from "@/types";

const PAGE_LIMIT = 15;

function formatNumber(value: string | number): string {
  const num = value.toString().replace(/[^0-9]/g, "");
  if (!num) return "";
  return new Intl.NumberFormat("id-ID").format(parseInt(num, 10));
}

interface DraftPlan {
  startDate: string;
  endDate: string;
  items: PlanItem[];
}

const emptyDraft = (): DraftPlan => ({
  startDate: dayjs().startOf("month").format("YYYY-MM-DD"),
  endDate: dayjs().endOf("month").format("YYYY-MM-DD"),
  items: [{ category: "", nominal: 0 }],
});

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

  const minStartForNew = useMemo(
    () =>
      latestEndDate
        ? dayjs(latestEndDate).add(1, "day").toDate()
        : dayjs().startOf("month").toDate(),
    [latestEndDate],
  );

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
  const [draft, setDraft] = useState<DraftPlan>(emptyDraft);
  const [deletingPlan, setDeletingPlan] = useState<PlanType | null>(null);

  const openForm = () => {
    if (latestEndDate) {
      const nextStart = dayjs(latestEndDate).add(1, "day");
      setDraft({
        startDate: nextStart.format("YYYY-MM-DD"),
        endDate: nextStart.endOf("month").format("YYYY-MM-DD"),
        items: [{ category: "", nominal: 0 }],
      });
    } else {
      setDraft(emptyDraft());
    }
    setShowForm(true);
  };

  const totalDraft = useMemo(
    () => draft.items.reduce((s, i) => s + i.nominal, 0),
    [draft.items],
  );

  const updateItem = (
    idx: number,
    field: keyof PlanItem,
    value: string | number,
  ) =>
    setDraft((prev) => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === idx ? { ...item, [field]: value } : item,
      ),
    }));

  // ── Invalidate both queries (home page uses "plans", this page uses "plans-paginated")
  const invalidatePlans = () => {
    queryClient.invalidateQueries({ queryKey: ["plans-paginated"] });
    queryClient.invalidateQueries({ queryKey: ["plans"] });
  };

  // ── Mutations ──────────────────────────────────────────────────────────────
  const saveMutation = useMutation({
    mutationFn: (plan: Partial<PlanType>) => createPlan(plan),
    onSuccess: () => {
      invalidatePlans();
      setShowForm(false);
      toast.success("Plan berhasil dibuat");
    },
    onError: () => toast.error("Gagal menyimpan plan"),
  });

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

  const handleSave = () => {
    if (!draft.startDate || !draft.endDate) {
      toast.error("Pilih periode plan");
      return;
    }
    if (draft.items.length === 0) {
      toast.error("Tambahkan minimal 1 kategori");
      return;
    }
    if (draft.items.some((i) => !i.category || i.nominal <= 0)) {
      toast.error("Lengkapi semua kategori dan nominal");
      return;
    }
    const newStart = dayjs(draft.startDate);
    const newEnd = dayjs(draft.endDate);
    const overlap = allPlans.some(
      (p) =>
        newStart.isBefore(dayjs(p.end_date)) &&
        newEnd.isAfter(dayjs(p.start_date)),
    );
    if (overlap) {
      toast.error("Periode bertabrakan dengan plan yang sudah ada");
      return;
    }
    saveMutation.mutate({
      start_date: draft.startDate,
      end_date: draft.endDate,
      items: draft.items,
      total_amount: totalDraft,
    });
  };

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
        {/* ── Add form ───────────────────────────────────────────────────── */}
        {showForm && (
          <div
            className="rounded-xl p-4 space-y-4"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border-visible)",
            }}
          >
            <div className="flex items-center justify-between">
              <p
                className="text-[13px] font-bold"
                style={{ color: "var(--text-display)" }}
              >
                Plan Baru
              </p>
              <span
                className="text-[14px] font-bold font-mono"
                style={{ color: "var(--accent)" }}
              >
                {formatCurrency(totalDraft)}
              </span>
            </div>

            {/* Date range */}
            <div className="space-y-1.5">
              <p
                className="text-[11px] font-medium"
                style={{ color: "var(--text-secondary)" }}
              >
                Periode
              </p>
              <DateRangePicker
                range={{
                  start: dayjs(draft.startDate).toDate(),
                  end: dayjs(draft.endDate).toDate(),
                }}
                onChange={(r) =>
                  setDraft((prev) => ({
                    ...prev,
                    startDate: dayjs(r.start).format("YYYY-MM-DD"),
                    endDate: dayjs(r.end).format("YYYY-MM-DD"),
                  }))
                }
                disableFuture={false}
                minDate={minStartForNew}
                placeholder="Pilih periode plan"
              />
              {latestEndDate && (
                <p
                  className="text-[11px]"
                  style={{ color: "var(--text-disabled)" }}
                >
                  Mulai dari{" "}
                  {dayjs(latestEndDate).add(1, "day").format("DD MMM YYYY")}
                </p>
              )}
            </div>

            {/* Category allocation */}
            <div className="space-y-2">
              <p
                className="text-[11px] font-medium"
                style={{ color: "var(--text-secondary)" }}
              >
                Alokasi Kategori
              </p>

              {draft.items.map((item, i) => {
                const usedByOthers = draft.items
                  .filter((_, j) => j !== i)
                  .map((x) => x.category)
                  .filter(Boolean);
                return (
                  <div key={i} className="flex gap-2 items-center">
                    <button
                      onClick={() =>
                        setDraft((prev) => ({
                          ...prev,
                          items: prev.items.filter((_, j) => j !== i),
                        }))
                      }
                      className="w-8 h-10 flex-shrink-0 flex items-center justify-center rounded-lg"
                      style={{
                        background: "var(--black)",
                        border: "1px solid var(--border-visible)",
                        color: "var(--text-disabled)",
                      }}
                    >
                      ×
                    </button>
                    <div className="flex-1 min-w-0">
                      <CategorySelect
                        value={item.category}
                        onChange={(cat) => updateItem(i, "category", cat)}
                        disabledCategories={usedByOthers}
                      />
                    </div>
                    <div className="flex-1 min-w-0 relative">
                      <span
                        className="absolute left-2 top-1/2 -translate-y-1/2 text-[11px] pointer-events-none"
                        style={{ color: "var(--text-disabled)" }}
                      >
                        Rp
                      </span>
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="0"
                        value={item.nominal ? formatNumber(item.nominal) : ""}
                        onChange={(e) =>
                          updateItem(
                            i,
                            "nominal",
                            parseInt(
                              e.target.value.replace(/[^0-9]/g, ""),
                              10,
                            ) || 0,
                          )
                        }
                        className="w-full h-10 pl-7 pr-2 text-[13px] font-bold text-right rounded-lg"
                        style={{
                          border: "1px solid var(--border-visible)",
                          background: "var(--black)",
                          color: "var(--text-primary)",
                        }}
                      />
                    </div>
                  </div>
                );
              })}

              {draft.items.length === 0 && (
                <p
                  className="text-[12px] text-center italic py-2"
                  style={{ color: "var(--text-disabled)" }}
                >
                  Tekan tombol di bawah untuk menambah kategori
                </p>
              )}

              {draft.items.length < allCategories.length && (
                <button
                  onClick={() =>
                    setDraft((prev) => ({
                      ...prev,
                      items: [...prev.items, { category: "", nominal: 0 }],
                    }))
                  }
                  className="w-full h-10 text-[13px] font-semibold rounded-lg flex items-center justify-center"
                  style={{
                    border: "1px dashed var(--border-visible)",
                    color: "var(--accent)",
                    background: "transparent",
                  }}
                >
                  + Tambah Alokasi Kategori
                </button>
              )}
            </div>

            <div
              className="flex gap-2 pt-4 border-t "
              style={{ borderColor: "var(--border-visible)" }}
            >
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 h-11 text-[13px] rounded-lg"
                style={{
                  border: "1px solid var(--border-visible)",
                  color: "var(--text-secondary)",
                  background: "transparent",
                }}
              >
                Batal
              </button>
              <button
                onClick={handleSave}
                disabled={saveMutation.isPending}
                className="flex-1 h-11 text-[13px] font-bold rounded-lg disabled:opacity-50"
                style={{ background: "var(--accent)", color: "white" }}
              >
                {saveMutation.isPending ? "Menyimpan..." : "Simpan Plan"}
              </button>
            </div>
          </div>
        )}

        {/* ── Plan list ──────────────────────────────────────────────────── */}
        {allPlans.length > 0 ? (
          <div className="space-y-3">
            {allPlans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                onDelete={setDeletingPlan}
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
