
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Fuse from "fuse.js";
import dayjs from "dayjs";
import { TransactionFormModal } from '@/components/transactions/TransactionFormModal';
import { TransactionList } from '@/components/transactions/TransactionList';
import { SearchInput } from '@/components/SearchInput';
import { BottomNav } from '@/components/layout/BottomNav';
import { DataActions } from '@/components/DataActions';
import { AppHeader } from '@/components/layout/AppHeader';
import { PageLayout } from '@/components/layout/PageLayout';
import { useTheme } from "@/hooks/useTheme";
import { useBudgetStore } from "@/store/budget";
import { formatCurrency } from "@/utils";
import { toMonthKey } from "@/types";

export default function TransactionPage() {
  const { mounted, darkMode, toggle } = useTheme();
  const navigate = useNavigate();
  const [showAddModal, setShowAddModal] = useState(false);
  const [search, setSearch] = useState("");
  const { transactions, getBudgetForMonth, budgetEntries, dateRange, setDateRange } = useBudgetStore();

  const start = dayjs(dateRange.start).startOf("day").toDate();
  const end = dayjs(dateRange.end).endOf("day").toDate();

  const budget = useMemo(
    () => budgetEntries.reduce((sum, e) => sum + e.amount, 0),
    [budgetEntries],
  );
  const filteredByRange = useMemo(
    () =>
      transactions.filter((t) => {
        const d = new Date(t.date);
        return d >= start && d <= end;
      }),
    [transactions, start, end],
  );

  const fuse = useMemo(
    () =>
      new Fuse(
        filteredByRange.map((t) => ({
          ...t,
          _items: t.details?.items?.map((i) => i.name).join(" ") || "",
        })),
        {
          keys: ["name", "keterangan", "_items"],
          threshold: 0.3,
          distance: 100,
          ignoreLocation: true,
        },
      ),
    [filteredByRange],
  );

  const filteredTransactions = useMemo(() => {
    if (!search.trim()) return filteredByRange;
    return fuse.search(search.trim()).map((r) => r.item);
  }, [search, fuse, filteredByRange]);

  const totalSpent = filteredTransactions.reduce(
    (sum, t) => sum + t.nominal,
    0,
  );
  const remaining = budget - totalSpent;
  const progress = budget > 0 ? (totalSpent / budget) * 100 : 0;

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
        title="Transaksi"
        dateRange={dateRange}
        onRangeChange={setDateRange}
      />

      {/* Budget summary bar */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => navigate("/budget")}
        className="w-full p-4 rounded-xl"
        style={{
          background: "var(--surface)",
          cursor: "pointer",
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-[15px] font-bold"
              style={{
                background:
                  remaining < 0 ? "rgba(215,25,33,0.15)" : "rgba(74,158,92,0.15)",
                color: remaining < 0 ? "var(--accent)" : "var(--success)",
              }}
            >
              {progress > 100 ? "!" : `${Math.min(progress, 100).toFixed(0)}%`}
            </div>
            <div className="text-left">
              <p
                className="text-[15px] font-semibold"
                style={{ color: "var(--text-display)" }}
              >
                {formatCurrency(remaining)}
              </p>
              <p
                className="text-[11px]"
                style={{ color: "var(--text-secondary)" }}
              >
                sisa dari {formatCurrency(budget)}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px]" style={{ color: "var(--text-disabled)" }}>dibelanjakan</p>
            <p className="text-[13px] font-mono font-bold" style={{ color: "var(--accent)" }}>
              {formatCurrency(totalSpent)}
            </p>
          </div>
        </div>
      </div>

      {/* Transaction List */}
      <div className="p-4 rounded-xl" style={{ background: "var(--surface)" }}>
        <div className="flex justify-between items-center mb-3 gap-2">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Cari transaksi..."
            className="flex-1"
          />
          <div className="flex items-center gap-2">
            <span
              className="px-2 py-0.5 rounded-full text-[11px] font-mono font-bold"
              style={{
                background: "var(--border)",
                color: "var(--text-primary)",
              }}
            >
              {filteredTransactions.length}
            </span>
            <button
              onClick={() => setShowAddModal(true)}
              className="h-8 px-3 text-[12px] font-bold rounded-lg flex items-center gap-1.5 transition-opacity hover:opacity-80"
              style={{
                background: "var(--accent)",
                color: "white",
                border: "none",
                cursor: "pointer",
              }}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M6 2V10M2 6H10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              Tambah
            </button>
          </div>
        </div>
        <TransactionList transactions={filteredTransactions} />
      </div>

      {/* Data Actions (Import/Export) */}
      <DataActions dateRange={dateRange} />

      {/* Add Transaction Modal */}
      <TransactionFormModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
      />

      <BottomNav />
    </PageLayout>
  );
}
