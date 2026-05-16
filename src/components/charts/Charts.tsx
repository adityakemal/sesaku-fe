import { useMemo, useState } from "react";
import { Doughnut, Bar, Line, Chart } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  LogarithmicScale,
  LineController,
  Filler,
} from "chart.js";
import type { ChartData, TooltipItem } from "chart.js";
import dayjs from "dayjs";
import type { CategoryBreakdownItem, SpendingTrendItem } from "@/api/statsApi";
import { getChartColor } from "./colors";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  LogarithmicScale,
  LineController,
  Filler,
);

const compact = new Intl.NumberFormat("id-ID", {
  notation: "compact",
  compactDisplay: "short",
});

type TrendTooltipData = {
  categoriesList?: Record<string, number>[];
  rawLabels?: string[];
};

type TrendTooltipDataset = TooltipItem<"bar">["dataset"] & {
  customData?: TrendTooltipData;
};

// ── 1. CATEGORY CHART ─────────────────────────────────────────────────────
// Accepts pre-aggregated data from /stats/category-breakdown

interface CategoryChartProps {
  data: CategoryBreakdownItem[];
  /** Visually highlights a category in the legend & donut (controlled externally). */
  selectedCategory?: string | null;
  /** @deprecated — kept for API compat; filter is now handled by the parent's pill row */
  onCategorySelect?: (category: string | null) => void;
}

export function CategoryChart({
  data: items,
  selectedCategory,
}: CategoryChartProps) {
  const { chartData, categoryData } = useMemo(() => {
    const labels = items.map((c) => c.name);
    const values = items.map((c) => c.total);

    return {
      chartData: {
        labels,
        datasets: [
          {
            data: values,
            backgroundColor: labels.map((_, i) => getChartColor(i)),
            borderWidth: 0,
            cutout: "65%",
          },
        ],
      },
      categoryData: items.map((c, i) => ({
        ...c,
        color: getChartColor(i),
      })),
    };
  }, [items]);

  if (items.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-[13px]" style={{ color: "var(--text-disabled)" }}>
          Belum ada data
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row gap-4 items-center">
      <div style={{ width: 160, height: 160, flexShrink: 0 }}>
        <Doughnut
          data={chartData}
          options={{
            plugins: { legend: { display: false }, tooltip: { enabled: true } },
            responsive: true,
            maintainAspectRatio: true,
          }}
        />
      </div>
      <div className="flex-1 w-full space-y-1.5">
        {categoryData.map((c) => {
          const isSelected = selectedCategory === c.name;
          const isDimmed = !!selectedCategory && !isSelected;

          return (
            <div
              key={c.name}
              className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 transition-all"
              style={{
                background: isSelected ? "rgba(215,25,33,0.06)" : "transparent",
                border: isSelected
                  ? "1px solid rgba(215,25,33,0.18)"
                  : "1px solid transparent",
                opacity: isDimmed ? 0.4 : 1,
              }}
            >
              <div
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ background: c.color }}
              />
              <span
                className="text-[13px] flex-1 truncate"
                style={{ color: "var(--text-primary)" }}
              >
                {c.name}
              </span>
              <span
                className="text-[12px] font-mono text-right"
                style={{ color: "var(--text-secondary)" }}
              >
                {compact.format(c.total)}
              </span>
              <span
                className="text-[11px] font-mono w-8 text-right"
                style={{ color: "var(--text-disabled)" }}
              >
                {c.percent.toFixed(0)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── 2. SPENDING TREND CHART ───────────────────────────────────────────────
// Accepts pre-aggregated daily rows from /stats/spending-trend
// Groups them into weekly / daily / monthly on the FE (pure UI concern)

interface SpendingTrendChartProps {
  data: SpendingTrendItem[];
  selectedMonth?: dayjs.Dayjs;
  selectedCategory?: string | null;
  selectedCategoryColor?: string;
  onClearCategory?: () => void;
}

export function SpendingTrendChart({
  data: days,
  selectedMonth,
  selectedCategory,
  selectedCategoryColor,
  onClearCategory,
}: SpendingTrendChartProps) {
  const [viewMode, setViewMode] = useState<"daily" | "weekly">("daily");

  const fmtFull = useMemo(() => new Intl.NumberFormat("id-ID"), []);

  const visibleDays = useMemo(() => {
    if (!selectedCategory) return days;

    return days
      .map((d) => {
        const total = d.categories?.[selectedCategory] ?? 0;
        return {
          ...d,
          total,
          categories: total > 0 ? { [selectedCategory]: total } : {},
        };
      })
      .filter((d) => d.total > 0);
  }, [days, selectedCategory]);

  const peakDay = useMemo(() => {
    if (visibleDays.length === 0) return null;
    return visibleDays.reduce(
      (max, d) => (d.total > max.total ? d : max),
      visibleDays[0],
    );
  }, [visibleDays]);

  const chartData = useMemo(() => {
    if (visibleDays.length === 0) return null;

    const barColor = selectedCategoryColor ?? "rgba(215, 25, 33, 0.8)";

    if (viewMode === "daily") {
      // Show only days that have transactions, labeled as day-of-month number
      return {
        labels: visibleDays.map((d) => dayjs(d.day).format("D")),
        datasets: [
          {
            // Line overlay — helps visually connect bars, especially when
            // bar heights vary wildly. Excluded from tooltip via filter below.
            type: "line",
            label: "Trend",
            data: visibleDays.map((d) => d.total),
            // Neutral white-ish so it contrasts against any bar color
            borderColor: "rgba(255,255,255,0.55)",
            borderWidth: 1.5,
            tension: 0.35,
            pointRadius: 3,
            pointHoverRadius: 5,
            pointBackgroundColor: "rgba(255,255,255,0.9)",
            fill: false,
          },
          {
            // Bar dataset — all interaction + tooltip data lives here
            data: visibleDays.map((d) => d.total),
            backgroundColor: visibleDays.map((d) =>
              peakDay?.day === d.day
                ? barColor.replace(/0\.8\)$/, "0.95)")
                : barColor.replace(/0\.8\)$/, "0.45)"),
            ),
            hoverBackgroundColor: barColor.replace(/0\.8\)$/, "1)"),
            borderWidth: 0,
            borderRadius: 4,
            barPercentage: 0.7,
            // Guarantees every bar ≥ 5px tall even with extreme outliers (e.g. 64K vs 8M)
            minBarLength: 5,
            customData: {
              categoriesList: visibleDays.map((d) => d.categories || {}),
              rawLabels: visibleDays.map((d) =>
                dayjs(d.day).format("D MMM YYYY"),
              ),
            },
          },
        ],
      };
    }

    // Weekly: group days into numbered weeks of the selected month
    const monthRef = selectedMonth ?? dayjs();
    const weekMap: Record<
      string,
      {
        total: number;
        categories: Record<string, number>;
        label: string;
        rawLabel: string;
      }
    > = {};
    visibleDays.forEach((d) => {
      const dayOfMonth = dayjs(d.day).date();
      const weekNum = Math.ceil(dayOfMonth / 7);
      const key = `w${weekNum}`;
      const weekStart = monthRef.startOf("month").add((weekNum - 1) * 7, "day");
      const weekEnd = weekStart.add(6, "day");
      const rawLabel = `${weekStart.format("D")}–${weekEnd.format("D MMM")}`;
      if (!weekMap[key]) {
        weekMap[key] = {
          total: 0,
          categories: {},
          label: `Mg ${weekNum}`,
          rawLabel,
        };
      }
      weekMap[key].total += d.total;
      const cats = d.categories as Record<string, number> | undefined;
      if (cats) {
        for (const [cat, val] of Object.entries(cats)) {
          weekMap[key].categories[cat] =
            (weekMap[key].categories[cat] || 0) + val;
        }
      }
    });

    const sorted = Object.entries(weekMap).sort(([a], [b]) =>
      a.localeCompare(b),
    );
    return {
      labels: sorted.map(([, v]) => v.label),
      datasets: [
        {
          // Line overlay — same filter pattern as daily, excluded from tooltip
          type: "line",
          label: "Trend",
          data: sorted.map(([, v]) => v.total),
          borderColor: "rgba(255,255,255,0.55)",
          borderWidth: 1.5,
          tension: 0.35,
          pointRadius: 3,
          pointHoverRadius: 5,
          pointBackgroundColor: "rgba(255,255,255,0.9)",
          fill: false,
        },
        {
          data: sorted.map(([, v]) => v.total),
          backgroundColor: barColor.replace(/0\.8\)$/, "0.5)"),
          hoverBackgroundColor: barColor.replace(/0\.8\)$/, "0.9)"),
          borderWidth: 0,
          borderRadius: 6,
          barPercentage: 0.55,
          minBarLength: 5,
          customData: {
            categoriesList: sorted.map(([, v]) => v.categories),
            rawLabels: sorted.map(([, v]) => v.rawLabel),
          },
        },
      ],
    };
  }, [visibleDays, viewMode, peakDay, selectedMonth, selectedCategoryColor]);

  if (days.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-[13px]" style={{ color: "var(--text-disabled)" }}>
          Belum ada transaksi bulan ini
        </p>
      </div>
    );
  }

  if (selectedCategory && visibleDays.length === 0) {
    return (
      <div
        className="rounded-xl px-4 py-6 text-center"
        style={{ background: "var(--black)" }}
      >
        <p
          className="text-[13px] font-medium"
          style={{ color: "var(--text-primary)" }}
        >
          Tidak ada transaksi {selectedCategory} bulan ini
        </p>
        <button
          type="button"
          onClick={onClearCategory}
          className="mt-2 text-[11px] font-semibold transition-opacity hover:opacity-80"
          style={{ color: "var(--accent)" }}
        >
          Tampilkan semua kategori
        </button>
      </div>
    );
  }

  const tooltipCallbacks = {
    title: (ctx: TooltipItem<"bar">[]) => {
      const idx = ctx[0].dataIndex;
      const ds = ctx[0].dataset as TrendTooltipDataset;
      return ds.customData?.rawLabels?.[idx] || ctx[0].label;
    },
    label: (ctx: TooltipItem<"bar">) => {
      return `Total: Rp ${fmtFull.format(ctx.parsed.y ?? 0)}`;
    },
    afterBody: (ctx: TooltipItem<"bar">[]) => {
      const idx = ctx[0].dataIndex;
      const ds = ctx[0].dataset as TrendTooltipDataset;
      const cats = ds.customData?.categoriesList?.[idx];
      if (!cats || Object.keys(cats).length === 0) return [];
      const sorted = Object.entries(cats)
        .filter(([, val]) => (val as number) > 0)
        .sort(([, a], [, b]) => (b as number) - (a as number));
      if (sorted.length === 0) return [];
      const lines: string[] = [""];
      for (const [c, val] of sorted) {
        lines.push(`• ${c} : Rp ${fmtFull.format(val as number)}`);
      }
      return lines;
    },
  };

  return (
    <div className="flex flex-col gap-3">
      {/* ── Header row: toggle + peak badge ── */}
      <div className="flex items-center justify-between gap-3">
        <div
          className="flex rounded-lg overflow-hidden"
          style={{ border: "1px solid var(--border)" }}
        >
          {(["daily", "weekly"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className="px-3 h-7 text-[11px] font-semibold transition-colors"
              style={{
                background: viewMode === mode ? "var(--accent)" : "transparent",
                color: viewMode === mode ? "white" : "var(--text-secondary)",
                border: "none",
                cursor: "pointer",
              }}
            >
              {mode === "daily" ? "Harian" : "Mingguan"}
            </button>
          ))}
        </div>
        {peakDay && (
          <div className="text-right">
            <p
              className="text-[10px]"
              style={{ color: "var(--text-disabled)" }}
            >
              Puncak bulan ini
            </p>
            <p
              className="text-[11px] font-semibold font-mono"
              style={{ color: "var(--accent)" }}
            >
              {dayjs(peakDay.day).format("D MMM")} &middot;{" "}
              {compact.format(peakDay.total)}
            </p>
          </div>
        )}
      </div>

      {/* ── Bar chart (horizontal scroll on mobile) ── */}
      {chartData &&
        (() => {
          const dataLen = chartData.labels?.length ?? 0;
          // Minimum 32px per bar; at least fill the container
          const minPxPerBar = viewMode === "daily" ? 32 : 64;
          const minChartW = dataLen * minPxPerBar;

          return (
            <div style={{ overflowX: "auto", overflowY: "hidden" }}>
              <div style={{ minWidth: minChartW, height: 180 }}>
                <Chart
                  type="bar"
                  data={
                    chartData as ChartData<"bar" | "line", number[], string>
                  }
                  options={{
                    plugins: {
                      legend: { display: false },
                      tooltip: {
                        mode: "index",
                        intersect: false,
                        displayColors: false,
                        backgroundColor: "rgba(15,15,15,0.95)",
                        titleColor: "rgba(255,255,255,0.9)",
                        bodyColor: "rgba(200,200,200,0.85)",
                        borderColor: "rgba(215,25,33,0.35)",
                        borderWidth: 1,
                        padding: 10,
                        // Exclude the "Trend" line overlay from tooltip items so that
                        // ctx[0] in callbacks is always the bar dataset with customData.
                        // Without this, with 2 datasets, ctx[0] = line (no customData)
                        // which causes the category breakdown to disappear.
                        filter: (item) => item.dataset.label !== "Trend",
                        callbacks: tooltipCallbacks,
                      },
                    },
                    scales: {
                      x: {
                        grid: { display: false },
                        ticks: {
                          color: "rgba(150,150,150,0.9)",
                          font: { size: 10 },
                          maxRotation: 0,
                        },
                        border: { display: false },
                      },
                      y: {
                        grid: { color: "rgba(150,150,150,0.12)" },
                        ticks: {
                          color: "rgba(150,150,150,0.9)",
                          font: { size: 10 },
                          callback: (v) => compact.format(Number(v)),
                          maxTicksLimit: 5,
                        },
                        // REQUIRED: Chart.js bar chart defaults to beginAtZero:true
                        // which overrides suggestedMin and forces the axis to start
                        // from 0 regardless of what suggestedMin is set to.
                        // Setting false allows suggestedMin to actually take effect.
                        beginAtZero: false,
                        // Soft floor — Chart.js uses this unless real data goes below it.
                        // Note: with very skewed data (e.g. 67K vs 8M), the axis
                        // starting at 50K still won't make the 67K bar look tall —
                        // that's honest data representation. minBarLength:5 ensures
                        // all bars remain tappable regardless of visual height.
                        suggestedMin: 50_000,
                        border: { display: false },
                      },
                    },
                    responsive: true,
                    maintainAspectRatio: false,
                  }}
                />
              </div>
            </div>
          );
        })()}

      {/* ── Context label ── */}
      <p
        className="text-[10px] text-center"
        style={{ color: "var(--text-disabled)" }}
      >
        {viewMode === "daily"
          ? `${visibleDays.length} hari bertransaksi · hover untuk detail kategori`
          : selectedCategory
            ? `Filter ${selectedCategory} · Minggu 1–5 dalam bulan ini`
            : `Minggu 1–5 dalam bulan ini`}
      </p>
    </div>
  );
}

// ── 3. PLAN COMPARISON CHART ──────────────────────────────────────────────
// Accepts pre-aggregated { category, plan, actual }[] from /stats/plan-summary

export interface PlanComparisonItem {
  category: string;
  plan: number;
  actual: number;
}

interface PlanComparisonChartProps {
  items: PlanComparisonItem[];
}

export function PlanComparisonChart({ items }: PlanComparisonChartProps) {
  const [selected, setSelected] = useState<PlanComparisonItem | null>(null);

  const fmt = (v: number) => "Rp " + new Intl.NumberFormat("id-ID").format(v);

  const chartData = useMemo(
    () => ({
      labels: items.map((i) => i.category),
      datasets: [
        {
          label: "Plan",
          data: items.map((i) => i.plan),
          backgroundColor: items.map((i) =>
            selected?.category === i.category
              ? "rgba(91, 155, 246, 1)"
              : "rgba(91, 155, 246, 0.55)",
          ),
          borderRadius: 4,
          barPercentage: 1,
          categoryPercentage: 0.8,
        },
        {
          label: "Realita",
          data: items.map((i) => i.actual),
          backgroundColor: items.map((i) =>
            selected?.category === i.category
              ? "rgba(215, 25, 33, 1)"
              : "rgba(215, 25, 33, 0.55)",
          ),
          borderRadius: 4,
          barPercentage: 1,
          categoryPercentage: 0.8,
        },
      ],
    }),
    [items, selected],
  );

  if (items.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-[13px]" style={{ color: "var(--text-disabled)" }}>
          Belum ada plan
        </p>
      </div>
    );
  }

  const diff = selected ? selected.actual - selected.plan : 0;
  const isOver = diff > 0;

  return (
    <div className="flex flex-col gap-3">
      <div style={{ height: 220 }}>
        <Bar
          data={chartData}
          options={{
            interaction: {
              mode: "index",
              intersect: false,
            },
            onClick: (_evt, elements) => {
              if (elements.length === 0) {
                setSelected(null);
                return;
              }
              const idx = elements[0].index;
              setSelected(items[idx]);
            },
            plugins: {
              legend: {
                display: true,
                position: "top",
                labels: {
                  color:
                    typeof document !== "undefined"
                      ? getComputedStyle(document.documentElement)
                          .getPropertyValue("--text-primary")
                          .trim() || "rgba(200,200,200,0.9)"
                      : "rgba(200,200,200,0.9)",
                  font: { size: 11 },
                  usePointStyle: true,
                  boxWidth: 8,
                  padding: 12,
                },
              },
              tooltip: {
                mode: "index",
                intersect: false,
                callbacks: {
                  label: (ctx) => {
                    const val = ctx.parsed.y;
                    if (val === null || val === undefined) return "";
                    return `${ctx.dataset.label}: ${fmt(val)}`;
                  },
                },
              },
            },
            scales: {
              x: {
                grid: { display: false },
                ticks: {
                  color: "rgba(150, 150, 150, 0.8)",
                  font: { size: 10 },
                },
                // stacked: true,
                border: { display: false },
              },
              y: {
                // stacked: true,
                grid: { color: "rgba(150, 150, 150, 0.2)" },
                ticks: {
                  color: "rgba(150, 150, 150, 0.8)",
                  font: { size: 10 },
                  callback: (v) => compact.format(Number(v)),
                  count: 6,
                },
                border: { display: false },
              },
            },
            responsive: true,
            maintainAspectRatio: false,
          }}
        />
      </div>

      {/* Info card — shown after clicking a bar */}
      {selected ? (
        <div
          className="rounded-xl px-4 py-3 flex flex-col gap-2"
          style={{
            background: "var(--black)",
            border: `1px solid ${isOver ? "rgba(215,25,33,0.3)" : "rgba(91,155,246,0.3)"}`,
          }}
        >
          {/* Header row */}
          <div className="flex items-center justify-between">
            <p
              className="text-[13px] font-semibold"
              style={{ color: "var(--text-display)" }}
            >
              {selected.category}
            </p>
            <button
              onClick={() => setSelected(null)}
              className="text-[16px] leading-none"
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--text-disabled)",
              }}
            >
              ×
            </button>
          </div>

          {/* Plan vs Realita row */}
          <div className="grid grid-cols-2 gap-2">
            <div
              className="rounded-lg px-3 py-2"
              style={{
                background: "rgba(91,155,246,0.08)",
                border: "1px solid rgba(91,155,246,0.2)",
              }}
            >
              <p
                className="text-[10px] font-semibold uppercase tracking-wide mb-0.5"
                style={{ color: "rgba(91,155,246,0.8)" }}
              >
                Plan
              </p>
              <p
                className="text-[13px] font-mono font-bold"
                style={{ color: "rgba(91,155,246,0.95)" }}
              >
                {fmt(selected.plan)}
              </p>
            </div>
            <div
              className="rounded-lg px-3 py-2"
              style={{
                background: "rgba(215,25,33,0.08)",
                border: "1px solid rgba(215,25,33,0.2)",
              }}
            >
              <p
                className="text-[10px] font-semibold uppercase tracking-wide mb-0.5"
                style={{ color: "rgba(215,25,33,0.8)" }}
              >
                Realita
              </p>
              <p
                className="text-[13px] font-mono font-bold"
                style={{ color: "rgba(215,25,33,0.95)" }}
              >
                {fmt(selected.actual)}
              </p>
            </div>
          </div>

          {/* Diff badge */}
          <div className="flex justify-end">
            <span
              className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
              style={{
                background: isOver
                  ? "rgba(215,25,33,0.12)"
                  : "rgba(74,158,92,0.12)",
                color: isOver ? "var(--accent)" : "var(--success)",
              }}
            >
              {isOver ? "▲ Over " : "▼ Sisa "}
              {fmt(Math.abs(diff))}
            </span>
          </div>
        </div>
      ) : (
        <p
          className="text-center text-[11px]"
          style={{ color: "var(--text-disabled)" }}
        >
          Ketuk bar untuk detail
        </p>
      )}
    </div>
  );
}

// ── 4. SAVINGS CHART (unchanged — already accepts aggregated data) ─────────

interface SavingsChartProps {
  monthlyData: { month: string; income: number; spent: number }[];
}

export function SavingsChart({ monthlyData }: SavingsChartProps) {
  const data = useMemo(() => {
    const labels = monthlyData.map((d) => dayjs(d.month + "-01").format("MMM"));
    const savings = monthlyData.map((d) => d.income - d.spent);

    return {
      labels,
      datasets: [
        {
          label: "Sisa Saldo",
          data: savings,
          borderColor: "rgba(74, 158, 92, 0.9)",
          backgroundColor: "rgba(74, 158, 92, 0.1)",
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: savings.map((v) =>
            v >= 0 ? "rgba(74, 158, 92, 1)" : "rgba(215, 25, 33, 1)",
          ),
          pointRadius: 4,
          pointHoverRadius: 6,
        },
      ],
    };
  }, [monthlyData]);

  if (monthlyData.length < 2) {
    return (
      <div className="text-center py-8">
        <p className="text-[13px]" style={{ color: "var(--text-disabled)" }}>
          Butuh data minimal 2 bulan
        </p>
      </div>
    );
  }

  return (
    <div style={{ height: 180 }}>
      <Line
        data={data}
        options={{
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (ctx) => {
                  const val = ctx.parsed.y;
                  if (val === null || val === undefined) return "";
                  const prefix = val >= 0 ? "+" : "";
                  return `${prefix}${new Intl.NumberFormat("id-ID").format(val)}`;
                },
              },
            },
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: { color: "rgba(150, 150, 150, 0.8)", font: { size: 11 } },
              border: { display: false },
            },
            y: {
              grid: { color: "rgba(150, 150, 150, 0.2)" },
              ticks: {
                color: "rgba(150, 150, 150, 0.8)",
                font: { size: 10 },
                callback: (v) => compact.format(Number(v)),
              },
              border: { display: false },
            },
          },
          responsive: true,
          maintainAspectRatio: false,
        }}
      />
    </div>
  );
}
