
import { useState, useMemo } from "react";
import dayjs from "dayjs";
import { CategoryChart, WeeklyChart, SavingsChart } from '@/components/charts/Charts';
import { BottomNav } from '@/components/layout/BottomNav';
import { AppHeader } from '@/components/layout/AppHeader';
import { PageLayout } from '@/components/layout/PageLayout';
import { useTheme } from "@/hooks/useTheme";
import { useBudgetStore } from "@/store/budget";
import { useStorageStore } from "@/store/storage";
import { formatCurrency } from "@/utils";
import { toMonthKey } from "@/types";
import type { DateRange } from "@/components/DatePicker";

export default function Home() {
  const { mounted, darkMode, toggle } = useTheme();
  const [dateRange, setDateRange] = useState<DateRange>(() => {
    const now = dayjs();
    return { start: now.startOf("month").toDate(), end: now.toDate() };
  });
  const {
    transactions,
    getBudgetForMonth,
    budgetEntries,
  } = useBudgetStore();

  const categories = useStorageStore((s) => s.listCategory).map((c) => c.name);

  const start = dayjs(dateRange.start).startOf("day").toDate();
  const end = dayjs(dateRange.end).endOf("day").toDate();

  const budget = useMemo(() => {
    const months = new Set<string>();
    let d = dayjs(dateRange.start).startOf("month");
    const endMonth = dayjs(dateRange.end).startOf("month");
    while (d.isBefore(endMonth) || d.isSame(endMonth, "month")) {
      months.add(toMonthKey(d.toDate()));
      d = d.add(1, "month");
    }
    return [...months].reduce((sum, m) => sum + getBudgetForMonth(m), 0);
  }, [dateRange, getBudgetForMonth]);
  const filteredTransactions = transactions.filter((t) => {
    const d = new Date(t.date);
    return d >= start && d <= end;
  });

  const totalSpent = filteredTransactions.reduce(
    (sum, t) => sum + t.nominal,
    0,
  );
  const remaining = budget - totalSpent;
  const progress = budget > 0 ? (totalSpent / budget) * 100 : 0;

  const rangeDays = dayjs(dateRange.end).diff(dayjs(dateRange.start), "day") + 1;
  const dailyAvg = rangeDays > 0 ? totalSpent / rangeDays : 0;
  const transactionCount = filteredTransactions.length;
  const avgPerTransaction = transactionCount > 0 ? totalSpent / transactionCount : 0;

  const catTotals: Record<string, number> = {};
  filteredTransactions.forEach((t) => {
    catTotals[t.kategori] = (catTotals[t.kategori] || 0) + t.nominal;
  });
  const topCategory = Object.entries(catTotals).sort((a, b) => b[1] - a[1])[0];

  const savingsData = useMemo(() => {
    const months: { month: string; budget: number; spent: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const m = dayjs(dateRange.start).subtract(i, "month");
      const key = toMonthKey(m.toDate());
      const mBudget = getBudgetForMonth(key);
      const mSpent = transactions
        .filter((t) => {
          const d = dayjs(t.date);
          return d.isSame(m, "month");
        })
        .reduce((s, t) => s + t.nominal, 0);

      if (mBudget > 0 || mSpent > 0) {
        months.push({ month: key, budget: mBudget, spent: mSpent });
      }
    }
    return months;
  }, [
    dateRange,
    transactions,
    getBudgetForMonth,
    budgetEntries,
  ]);

  if (!mounted) {
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
      {/* Header */}
      <AppHeader
        title="sesaKu"
        dateRange={dateRange}
        onRangeChange={setDateRange}
      />

      {/* Budget Overview */}
      <div className="p-4 rounded-xl " style={{ background: "var(--surface)" }}>
        <div className="flex justify-between items-center mb-2 flex-wrap gap-2">
          <div className="">
            <p
              className="text-[12px] font-medium mb-0.5"
              style={{ color: "var(--text-secondary)" }}
            >
              Sisa Budget
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
          <div className=" sm:justify-end justify-start">
            <p
              className="text-[12px] whitespace-nowrap"
              style={{ color: "var(--text-secondary)" }}
            >
              {formatCurrency(totalSpent)} / {formatCurrency(budget)}
            </p>
          </div>
        </div>

        {/* Progress bar */}
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

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-2">
        <StatCard label="Transaksi" value={String(transactionCount)} />
        <StatCard
          label="Rata-rata/hari"
          value={formatCurrency(dailyAvg)}
          small
        />
        <StatCard
          label="Rata-rata/Trx"
          value={formatCurrency(avgPerTransaction)}
          small
        />
      </div>

      {/* Top Category */}
      {topCategory && (
        <div
          className="p-4 rounded-xl flex items-center justify-between"
          style={{ background: "var(--surface)" }}
        >
          <div>
            <p
              className="text-[12px] mb-0.5"
              style={{ color: "var(--text-secondary)" }}
            >
              Pengeluaran terbesar
            </p>
            <p
              className="text-[16px] font-semibold"
              style={{ color: "var(--text-display)" }}
            >
              {topCategory[0]}
            </p>
          </div>
          <p
            className="text-[16px] font-mono font-bold"
            style={{ color: "var(--accent)" }}
          >
            {formatCurrency(topCategory[1])}
          </p>
        </div>
      )}

      {/* Charts */}
      {filteredTransactions.length > 0 && (
        <>
          <div
            className="p-4 rounded-xl"
            style={{ background: "var(--surface)" }}
          >
            <p
              className="text-[13px] font-medium mb-3"
              style={{ color: "var(--text-secondary)" }}
            >
              Kategori
            </p>
            <CategoryChart
              transactions={filteredTransactions}
              categories={categories}
            />
          </div>

          <div
            className="p-4 rounded-xl"
            style={{ background: "var(--surface)" }}
          >
            <WeeklyChart
              transactions={filteredTransactions}
              selectedMonth={dateRange.start}
            />
          </div>
        </>
      )}

      {/* Savings Trend */}
      <div className="p-4 rounded-xl" style={{ background: "var(--surface)" }}>
        <p
          className="text-[13px] font-medium mb-3"
          style={{ color: "var(--text-secondary)" }}
        >
          Tren Sisa Budget
        </p>
        <SavingsChart monthlyData={savingsData} />
      </div>
      <BottomNav />
    </PageLayout>
  );
}

function StatCard({
  label,
  value,
  small,
  alert,
}: {
  label: string;
  value: string;
  small?: boolean;
  alert?: boolean;
}) {
  return (
    <div className="p-3 rounded-xl" style={{ background: "var(--surface)" }}>
      <p
        className="text-[11px] mb-1"
        style={{ color: "var(--text-secondary)" }}
      >
        {label}
      </p>
      <p
        className={`font-semibold leading-tight ${small ? "text-[13px] font-mono" : "text-[20px] font-display"}`}
        style={{ color: alert ? "var(--accent)" : "var(--text-display)" }}
      >
        {value}
      </p>
    </div>
  );
}

function getStatusColor(progress: number) {
  if (progress > 100) return "var(--accent)";
  if (progress > 80) return "var(--warning)";
  return "var(--success)";
}
