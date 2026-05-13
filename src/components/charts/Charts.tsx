import { useMemo, useState } from "react";
import { Doughnut, Bar, Line } from "react-chartjs-2";
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
  Filler,
} from "chart.js";
import dayjs from "dayjs";
import type { CategoryBreakdownItem, SpendingTrendItem } from "@/api/statsApi";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Filler,
);

const compact = new Intl.NumberFormat("id-ID", {
  notation: "compact",
  compactDisplay: "short",
});

const COLORS = [
  "rgba(215, 25, 33, 0.8)",
  "rgba(74, 158, 92, 0.8)",
  "rgba(212, 168, 67, 0.8)",
  "rgba(91, 155, 246, 0.8)",
  "rgba(168, 85, 247, 0.8)",
  "rgba(236, 72, 153, 0.8)",
  "rgba(245, 158, 11, 0.8)",
  "rgba(20, 184, 166, 0.8)",
];

// ── 1. CATEGORY CHART ─────────────────────────────────────────────────────
// Accepts pre-aggregated data from /stats/category-breakdown

interface CategoryChartProps {
  data: CategoryBreakdownItem[];
}

export function CategoryChart({ data: items }: CategoryChartProps) {
  const { chartData, categoryData } = useMemo(() => {
    const labels = items.map((c) => c.name);
    const values = items.map((c) => c.total);

    return {
      chartData: {
        labels,
        datasets: [
          {
            data: values,
            backgroundColor: labels.map((_, i) => COLORS[i % COLORS.length]),
            borderWidth: 0,
            cutout: "65%",
          },
        ],
      },
      categoryData: items.map((c, i) => ({
        ...c,
        color: COLORS[i % COLORS.length],
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
      <div className="flex-1 w-full space-y-2">
        {categoryData.map((c) => (
          <div key={c.name} className="flex items-center gap-2">
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
        ))}
      </div>
    </div>
  );
}

// ── 2. SPENDING TREND CHART ───────────────────────────────────────────────
// Accepts pre-aggregated daily rows from /stats/spending-trend
// Groups them into weekly / daily / monthly on the FE (pure UI concern)

interface SpendingTrendChartProps {
  data: SpendingTrendItem[];
}

export function SpendingTrendChart({ data: days }: SpendingTrendChartProps) {
  const [viewMode, setViewMode] = useState<"weekly" | "daily" | "monthly">(
    "weekly",
  );

  const chartData = useMemo(() => {
    if (days.length === 0) return null;

    if (viewMode === "daily") {
      return {
        labels: days.map((d) => dayjs(d.day).format("D")),
        datasets: [
          {
            data: days.map((d) => d.total),
            backgroundColor: "rgba(215, 25, 33, 0.5)",
            hoverBackgroundColor: "rgba(215, 25, 33, 0.8)",
            borderWidth: 0,
            borderRadius: 2,
            barPercentage: 0.8,
          },
        ],
      };
    }

    if (viewMode === "monthly") {
      const monthMap: Record<string, number> = {};
      days.forEach((d) => {
        const key = d.day.slice(0, 7); // "YYYY-MM"
        monthMap[key] = (monthMap[key] || 0) + d.total;
      });
      const sorted = Object.entries(monthMap).sort(([a], [b]) =>
        a.localeCompare(b),
      );
      return {
        labels: sorted.map(([k]) => dayjs(k + "-01").format("MMM YY")),
        datasets: [
          {
            data: sorted.map(([, v]) => v),
            backgroundColor: "rgba(215, 25, 33, 0.5)",
            hoverBackgroundColor: "rgba(215, 25, 33, 0.8)",
            borderWidth: 0,
            borderRadius: 6,
            barPercentage: 0.6,
          },
        ],
      };
    }

    // Weekly: group consecutive days into ~7-day buckets
    const weekMap: Record<string, number> = {};
    days.forEach((d) => {
      const weekStart = dayjs(d.day).startOf("week").format("MM/DD");
      weekMap[weekStart] = (weekMap[weekStart] || 0) + d.total;
    });
    const sorted = Object.entries(weekMap).sort(([a], [b]) =>
      a.localeCompare(b),
    );
    return {
      labels: sorted.map(([k]) => k),
      datasets: [
        {
          data: sorted.map(([, v]) => v),
          backgroundColor: "rgba(215, 25, 33, 0.5)",
          hoverBackgroundColor: "rgba(215, 25, 33, 0.8)",
          borderWidth: 0,
          borderRadius: 6,
          barPercentage: 0.6,
        },
      ],
    };
  }, [days, viewMode]);

  if (days.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-[13px]" style={{ color: "var(--text-disabled)" }}>
          Belum ada data
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        {(["weekly", "daily", "monthly"] as const).map((mode) => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            className="px-3 h-8 text-[12px] font-semibold rounded-lg transition-colors"
            style={{
              background: viewMode === mode ? "var(--accent)" : "transparent",
              color: viewMode === mode ? "white" : "var(--text-secondary)",
              border:
                viewMode === mode
                  ? "1px solid var(--accent)"
                  : "1px solid var(--border)",
            }}
          >
            {mode === "weekly"
              ? "Per Minggu"
              : mode === "daily"
                ? "Per Hari"
                : "Per Bulan"}
          </button>
        ))}
      </div>
      <div style={{ height: 160 }}>
        {chartData && (
          <Bar
            data={chartData}
            options={{
              plugins: { legend: { display: false } },
              scales: {
                x: {
                  grid: { display: false },
                  ticks: {
                    color: "rgba(150, 150, 150, 0.8)",
                    font: { size: 10 },
                  },
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
        )}
      </div>
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
          barPercentage: 0.8,
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
          barPercentage: 0.8,
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
