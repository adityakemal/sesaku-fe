import { useState, useMemo } from "react";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  CategoryChart,
  SpendingTrendChart,
  PlanComparisonChart,
} from "@/components/charts/Charts";
import { getChartColor } from "@/components/charts/colors";
import { BottomNav } from "@/components/layout/BottomNav";
import { LuCircleAlert } from "react-icons/lu";
import { AppHeader } from "@/components/layout/AppHeader";
import { PageLayout } from "@/components/layout/PageLayout";
import { useTheme } from "@/hooks/useTheme";
import { useIncomeStore } from "@/store/income";
import { formatCurrency } from "@/utils";
import { MonthNavigator } from "@/components/MonthNavigator";

import { LoadingPage } from "@/components/layout/LoadingPage";
import {
  getDashboardSummary,
  getCategoryBreakdown,
  getSpendingTrend,
  getPlanSummary,
} from "@/api/statsApi";
import { getPlans } from "@/api/planApi";
import type { Plan as PlanType } from "@/types";
import { formatToSimpleIDR } from "@/lib/utils";

// Helper to format a month selector (YYYY-MM)
const toMonthParam = (d: dayjs.Dayjs) => ({
  start: d.startOf("month").toISOString(),
  end: d.endOf("month").toISOString(),
});

export default function Home() {
  const navigate = useNavigate();
  const { mounted } = useTheme();
  // UI-only: selected month for the spending section
  const [selectedMonth, setSelectedMonth] = useState(() => dayjs());
  const [selectedTrendCategory, setSelectedTrendCategory] = useState<
    string | null
  >(null);
  const monthParams = useMemo(
    () => toMonthParam(selectedMonth),
    [selectedMonth],
  );

  // Global income info (all-time) from the store
  const { totalIncome, totalTransaction } = useIncomeStore();

  // ── Fetch active plan list ──────────────────────────────────────────────
  const { data: plansData } = useQuery({
    queryKey: ["plans"],
    queryFn: async () => {
      const res = await getPlans();
      return res.data.data as PlanType[];
    },
    staleTime: 60_000,
  });

  // Active plan: strict match based on today's date
  const activePlan = useMemo(() => {
    if (!plansData || plansData.length === 0) return null;
    const today = dayjs();
    const current = plansData.find(
      (p) =>
        !dayjs(p.start_date).isAfter(today, "day") &&
        !dayjs(p.end_date).isBefore(today, "day"),
    );
    return current || null;
  }, [plansData]);

  // ── Fetch plan summary from BE (spending vs plan per category) ──────────
  const { data: planSummaryData } = useQuery({
    queryKey: ["plan-summary", activePlan?.id],
    queryFn: async () => {
      const res = await getPlanSummary(activePlan!.id);
      return res.data.data;
    },
    enabled: !!activePlan?.id,
    staleTime: 60_000,
  });

  // ── Fetch dashboard summary cards for selected month ───────────────────
  const { data: summaryData, isLoading: summaryLoading } = useQuery({
    queryKey: ["dashboard-summary", monthParams.start],
    queryFn: async () => {
      const res = await getDashboardSummary(monthParams);
      return res.data.data;
    },
    staleTime: 30_000,
  });

  // ── Fetch category breakdown for selected month ─────────────────────────
  const { data: categoryData } = useQuery({
    queryKey: ["category-breakdown", monthParams.start],
    queryFn: async () => {
      const res = await getCategoryBreakdown(monthParams);
      return res.data.data;
    },
    staleTime: 30_000,
  });

  // ── Fetch spending trend for selected month ──────────────────────────────
  const { data: trendData } = useQuery({
    queryKey: ["spending-trend", monthParams.start],
    queryFn: async () => {
      const res = await getSpendingTrend(monthParams);
      return res.data.data;
    },
    staleTime: 30_000,
  });

  // ── Derived from summary ────────────────────────────────────────────────
  const remaining = totalIncome - totalTransaction;
  const progress = totalIncome > 0 ? (totalTransaction / totalIncome) * 100 : 0;

  const rangeTotal = summaryData?.rangeTotal ?? 0;
  const rangeCount = summaryData?.rangeCount ?? 0;
  const dailyAvg = summaryData?.dailyAvg ?? 0;
  const avgPerTx = summaryData?.avgPerTx ?? 0;
  const topCategory = summaryData?.topCategory ?? null;

  const planTotal = planSummaryData?.planTotal ?? 0;
  const planSpent = planSummaryData?.planSpent ?? 0;
  const planRemaining = planSummaryData?.planRemaining ?? 0;
  const planUsagePct = planSummaryData?.usagePercent ?? 0;
  const planCategories = planSummaryData?.categories ?? [];

  const selectedTrendCategoryMeta = useMemo(() => {
    if (!selectedTrendCategory || !categoryData) return null;
    const index = categoryData.findIndex(
      (c) => c.name === selectedTrendCategory,
    );
    if (index === -1) return null;
    return {
      ...categoryData[index],
      color: getChartColor(index),
    };
  }, [categoryData, selectedTrendCategory]);

  const activeTrendCategory = selectedTrendCategoryMeta?.name ?? null;

  // ── View mode for trend chart (lifted from SpendingTrendChart) ────────────
  const [viewMode, setViewMode] = useState<"daily" | "weekly">("daily");

  // Peak day: the day with the highest total spending in trendData
  const peakDay = useMemo(() => {
    if (!trendData || trendData.length === 0) return null;
    return trendData.reduce((max, d) => (d.total > max.total ? d : max));
  }, [trendData]);

  if (!mounted || summaryLoading) return <LoadingPage />;

  return (
    <PageLayout>
      {/* Header — no dateRange picker here */}
      <AppHeader title="sesaKu" isShowDatepicker={false} showLogo={true} />

      {/* ── 1. REALITA VS PLAN ── */}
      {activePlan ? (
        <div
          className="rounded-xl overflow-hidden"
          style={{
            background: "var(--surface)",
            //  border: "1px solid var(--accent)"
            boxShadow: "0px 1px 6px var(--accent)",
          }}
        >
          {/* Card header */}
          <div
            className="px-4 py-3 flex items-center justify-between"
            style={{
              background:
                "linear-gradient(135deg, rgba(215,25,33,0.12) 0%, rgba(91,155,246,0.08) 100%)",
              borderBottom: "1px solid var(--border)",
            }}
          >
            <div>
              <p
                className="text-[11px] font-semibold"
                style={{ color: "var(--accent)" }}
              >
                Plan Aktif
                <span
                  className="font-normal ml-1"
                  style={{ color: "var(--text-disabled)" }}
                >
                  {dayjs(activePlan.start_date).format("DD MMM")} –{" "}
                  {dayjs(activePlan.end_date).format("DD MMM YY")}
                </span>
              </p>
              <p
                className="text-[16px] font-bold mt-0.5"
                style={{ color: "var(--text-display)" }}
              >
                Realita vs Plan
              </p>
            </div>
            <div className="text-right">
              <p
                className="text-[11px]"
                style={{ color: "var(--text-secondary)" }}
              >
                {planRemaining >= 0 ? "Sisa Plan" : "Over Plan"}
              </p>
              <p
                className="text-[15px] font-mono font-bold"
                style={{
                  color:
                    planRemaining >= 0 ? "var(--success)" : "var(--accent)",
                }}
              >
                {planRemaining >= 0 ? "+" : ""}
                {formatCurrency(Math.abs(planRemaining))}
              </p>
            </div>
          </div>

          {/* 3-col summary */}
          <div
            className="grid grid-cols-3"
            style={{
              background: "var(--surface)",
              borderBottom: "1px solid var(--border)",
              borderColor: "var(--border)",
            }}
          >
            <div className="px-3 py-3 text-center">
              <p
                className="text-[10px] uppercase font-bold tracking-wide mb-1"
                style={{ color: "var(--text-disabled)" }}
              >
                Plan
              </p>
              <p
                className="text-[13px] font-mono font-bold"
                style={{ color: "rgba(91,155,246,0.95)" }}
              >
                {formatToSimpleIDR(planTotal)}
              </p>
            </div>
            <div className="px-3 py-3 text-center border-l border-r border-[var(--border)]">
              <p
                className="text-[10px] uppercase font-bold tracking-wide mb-1"
                style={{ color: "var(--text-disabled)" }}
              >
                Terpakai
              </p>
              <p
                className="text-[13px] font-mono font-bold"
                style={{ color: "rgba(215,25,33,0.95)" }}
              >
                {formatToSimpleIDR(planSpent)}
              </p>
            </div>
            <div className="px-3 py-3 text-center">
              <p
                className="text-[10px] uppercase font-bold tracking-wide mb-1"
                style={{ color: "var(--text-disabled)" }}
              >
                Usage
              </p>
              <p
                className="text-[13px] font-mono font-bold"
                style={{
                  color:
                    planUsagePct > 100
                      ? "var(--accent)"
                      : planUsagePct > 80
                        ? "var(--warning)"
                        : "var(--success)",
                }}
              >
                {planTotal > 0
                  ? `${Math.min(planUsagePct, 999).toFixed(0)}%`
                  : "—"}
              </p>
            </div>
          </div>

          {/* Plan comparison chart */}
          <div className="p-4" style={{ background: "var(--surface)" }}>
            <PlanComparisonChart items={planCategories} />
          </div>
          {/* Unbudgeted Categories Warning */}
          {planSummaryData?.unbudgetedCategories &&
            planSummaryData.unbudgetedCategories.length > 0 && (
              <button
                onClick={() => navigate("/plan")}
                className="mx-4 mb-4 px-3 py-2.5 rounded-lg flex items-start gap-2 text-left w-[calc(100%-32px)] hover:opacity-80 transition-opacity"
                style={{
                  background: "rgba(212,168,67,0.08)",
                  border: "1px solid rgba(212,168,67,0.3)",
                }}
              >
                <LuCircleAlert
                  size={16}
                  color="var(--warning)"
                  className="mt-0.5 shrink-0"
                />
                <div>
                  <p
                    className="text-[12px] font-semibold mb-0.5"
                    style={{ color: "var(--warning)" }}
                  >
                    Pengeluaran di luar plan
                  </p>
                  <p
                    className="text-[11px] leading-relaxed"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Terdapat transaksi yang belum masuk plan:{" "}
                    <span
                      className="font-semibold"
                      style={{ color: "var(--text-primary)" }}
                    >
                      <ul style={{ listStyleType: "disc", marginLeft: "20px" }}>
                        {planSummaryData.unbudgetedCategories.map((c) => (
                          <li key={c.category}>
                            {c.category} ({formatCurrency(c.actual)})
                          </li>
                        ))}
                      </ul>
                    </span>
                    Silahkan Edit plan aktif Anda di halaman plan.
                  </p>
                </div>
              </button>
            )}
        </div>
      ) : (
        /* CTA — no plan yet */
        <div
          className="p-4 rounded-xl flex items-center justify-between gap-3"
          style={{
            background: "var(--surface)",
            border: "1px dashed var(--border-visible)",
          }}
        >
          <div>
            <p
              className="text-[14px] font-semibold"
              style={{ color: "var(--text-display)" }}
            >
              Buat Plan Anggaran
            </p>
            <p
              className="text-[12px] mt-0.5"
              style={{ color: "var(--text-disabled)" }}
            >
              Bandingkan pengeluaran nyata dengan rencanamu
            </p>
          </div>
          <button
            onClick={() => navigate("/plan")}
            className="flex-shrink-0 h-9 px-4 text-[12px] font-bold rounded-lg"
            style={{ background: "var(--accent)", color: "white" }}
          >
            Atur Plan →
          </button>
        </div>
      )}

      {/* ── 2. INCOME OVERVIEW (all-time) ── */}
      <div className="p-4 rounded-xl" style={{ background: "var(--surface)" }}>
        <div className="flex justify-between items-center mb-2 flex-wrap gap-2">
          <div>
            <p
              className="text-[12px] font-medium mb-0.5"
              style={{ color: "var(--text-secondary)" }}
            >
              Sisa Saldo
            </p>
            <p
              className="text-2xl md:text-4xl font-bold font-display leading-none whitespace-nowrap"
              style={{
                color: remaining < 0 ? "var(--accent)" : "var(--text-display)",
              }}
            >
              {formatCurrency(remaining)}
            </p>
          </div>
          <div>
            <p
              className="text-[12px] whitespace-nowrap"
              style={{ color: "var(--text-secondary)" }}
            >
              {formatCurrency(totalTransaction)} / {formatCurrency(totalIncome)}
            </p>
          </div>
        </div>
        <div className="flex gap-2 items-center">
          <div
            className="h-2 w-full rounded-full overflow-hidden"
            style={{ background: "var(--border)" }}
          >
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(progress, 100)}%`,
                background: getStatusColor(progress),
              }}
            />
          </div>
          <p
            className="text-[14px] font-mono font-bold whitespace-nowrap"
            style={{ color: getStatusColor(progress) }}
          >
            {progress > 100 ? "Over " : ""}
            {Math.min(progress, 999).toFixed(0)}%
          </p>
        </div>
      </div>

      {/* ── 3. MONTHLY SPENDING SECTION ── */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ background: "var(--surface)" }}
      >
        {/* Month navigator — centered, with prev/next chevrons + click-to-pick */}
        <div
          className="px-4 py-2 flex items-center justify-center"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <MonthNavigator
            value={selectedMonth}
            onChange={setSelectedMonth}
            disableFuture
          />
        </div>

        {/* Quick stats for selected month */}
        {summaryLoading ? (
          <div className="p-6 flex justify-center">
            <div
              className="w-4 h-4 rounded-full"
              style={{
                border: "2px solid var(--accent)",
                borderTopColor: "transparent",
                animation: "spin 0.6s linear infinite",
              }}
            />
          </div>
        ) : (
          <>
            <div
              className="grid grid-cols-3 "
              style={{
                borderBottom: "1px solid var(--border)",
                borderColor: "var(--border)",
              }}
            >
              <div className="px-3 py-3 text-center">
                <p
                  className="text-[10px] uppercase font-bold tracking-wide mb-1"
                  style={{ color: "var(--text-disabled)" }}
                >
                  Terbesar
                </p>
                <p
                  className="text-[13px] font-mono font-bold"
                  style={{ color: "var(--accent)" }}
                >
                  {formatToSimpleIDR(topCategory.total)}
                </p>
                <p
                  className="text-[10px]"
                  style={{ color: "var(--text-display)" }}
                >
                  {topCategory.name}
                </p>
              </div>
              <div className="px-3 py-3 text-center border-l border-r border-[var(--border)]">
                <p
                  className="text-[10px] uppercase font-bold tracking-wide mb-1"
                  style={{ color: "var(--text-disabled)" }}
                >
                  Transaksi
                </p>
                <p
                  className="text-[18px] font-display font-bold"
                  style={{ color: "var(--text-display)" }}
                >
                  {rangeCount}
                </p>
              </div>
              <div className="px-3 py-3 text-center">
                <p
                  className="text-[10px] uppercase font-bold tracking-wide mb-1"
                  style={{ color: "var(--text-disabled)" }}
                >
                  Puncak
                </p>
                {peakDay ? (
                  <>
                    <p
                      className="text-[13px] font-mono font-bold"
                      style={{ color: "var(--accent)" }}
                    >
                      {formatToSimpleIDR(peakDay.total)}
                    </p>
                    <p
                      className="text-[10px]"
                      style={{ color: "var(--text-disabled)" }}
                    >
                      {dayjs(peakDay.day).format("D MMM")}
                    </p>
                  </>
                ) : (
                  <p
                    className="text-[13px] font-mono font-bold"
                    style={{ color: "var(--text-display)" }}
                  >
                    —
                  </p>
                )}
              </div>
            </div>

            {/* Total for the month + top category */}
            <div
              className="px-4 py-3 flex items-center justify-between"
              style={{ borderBottom: "1px solid var(--border)" }}
            >
              <div>
                <p
                  className="text-[11px]"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Total{" "}
                  {selectedMonth.isSame(dayjs(), "month")
                    ? "Bulan Ini"
                    : dayjs(selectedMonth).format("MMMM YYYY")}
                </p>
                <p
                  className="text-[20px] font-mono font-bold"
                  style={{ color: "var(--accent)" }}
                >
                  {formatCurrency(rangeTotal)}
                </p>
              </div>
              {/* {topCategory && (
                <div className="text-right">
                  <p
                    className="text-[11px]"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Terbesar
                  </p>
                  <p
                    className="text-[13px] font-semibold"
                    style={{ color: "var(--text-display)" }}
                  >
                    {topCategory.name}
                  </p>
                  <p
                    className="text-[12px] font-mono"
                    style={{ color: "var(--text-disabled)" }}
                  >
                    {formatCurrency(topCategory.total)}
                  </p>
                </div>
              )} */}
            </div>

            {/* Charts */}
            {rangeCount > 0 && (
              <>
                {/* spending trend chart — filter lives here, where it makes sense */}
                <div className="p-4">
                  {/* Section header: title left, toggle right */}
                  <div className="flex items-center justify-between mb-4">
                    <p
                      className="text-[13px] font-medium"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      Tren Pengeluaran
                    </p>
                    {/* Daily / Weekly toggle */}
                    <div
                      className="flex rounded-lg overflow-hidden"
                      style={{ border: "1px solid var(--border)" }}
                    >
                      {(["daily", "weekly"] as const).map((mode) => (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => setViewMode(mode)}
                          className="px-3 h-7 text-[11px] font-semibold transition-colors"
                          style={{
                            background:
                              viewMode === mode
                                ? "var(--accent)"
                                : "transparent",
                            color:
                              viewMode === mode
                                ? "white"
                                : "var(--text-secondary)",
                            border: "none",
                            cursor: "pointer",
                          }}
                        >
                          {mode === "daily" ? "Harian" : "Mingguan"}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Scrollable category filter pills */}
                  <div
                    className="flex gap-1.5 overflow-x-auto pb-1 mb-3"
                    style={{
                      scrollbarWidth: "none",
                      msOverflowStyle: "none",
                    }}
                  >
                    {/* "Semua" pill */}
                    <button
                      type="button"
                      onClick={() => setSelectedTrendCategory(null)}
                      className="flex-shrink-0 flex items-center gap-1.5 px-3 h-7 rounded-full text-[11px] font-semibold transition-all"
                      style={{
                        color: !activeTrendCategory
                          ? "white"
                          : "var(--text-secondary)",
                        border: !activeTrendCategory
                          ? "1px solid var(--accent)"
                          : "1px solid var(--border-visible)",
                      }}
                    >
                      Semua
                    </button>

                    {/* One pill per category */}
                    {(categoryData ?? []).map((cat, i) => {
                      const color = getChartColor(i);
                      const isActive = activeTrendCategory === cat.name;
                      return (
                        <button
                          key={cat.name}
                          type="button"
                          onClick={() =>
                            setSelectedTrendCategory(isActive ? null : cat.name)
                          }
                          className="flex-shrink-0 flex items-center gap-1.5 px-3 h-7 rounded-full text-[11px] font-semibold transition-all"
                          style={{
                            background: isActive ? color : "var(--black)",
                            color: isActive ? "#fff" : "var(--text-secondary)",
                            border: isActive
                              ? `1px solid ${color}`
                              : "1px solid var(--border-visible)",
                            boxShadow: isActive ? `0 0 8px ${color}66` : "none",
                          }}
                        >
                          {!isActive && (
                            <span
                              className="w-2 h-2 rounded-full flex-shrink-0"
                              style={{ background: color }}
                            />
                          )}
                          {cat.name}
                        </button>
                      );
                    })}
                  </div>

                  <SpendingTrendChart
                    data={trendData ?? []}
                    selectedMonth={selectedMonth}
                    selectedCategory={activeTrendCategory}
                    selectedCategoryColor={selectedTrendCategoryMeta?.color}
                    onClearCategory={() => setSelectedTrendCategory(null)}
                    viewMode={viewMode}
                  />
                </div>

                {/* category breakdown chart — pure display, no filter UI here */}
                <div
                  className="p-4"
                  style={{ borderBottom: "1px solid var(--border)" }}
                >
                  {/* <p
                    className="text-[13px] font-medium mb-3"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Rincian Pengeluaran
                  </p> */}
                  <CategoryChart
                    data={categoryData ?? []}
                    selectedCategory={activeTrendCategory}
                    onCategorySelect={setSelectedTrendCategory}
                  />
                </div>
              </>
            )}

            {rangeCount === 0 && (
              <div className="p-8 text-center">
                <p
                  className="text-[13px]"
                  style={{ color: "var(--text-disabled)" }}
                >
                  Belum ada transaksi bulan ini
                </p>
              </div>
            )}
          </>
        )}
      </div>

      <BottomNav />
    </PageLayout>
  );
}

function getStatusColor(progress: number) {
  if (progress > 100) return "var(--accent)";
  if (progress > 80) return "var(--warning)";
  return "var(--success)";
}
