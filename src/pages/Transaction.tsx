import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Fuse from "fuse.js";
import dayjs from "dayjs";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getTransactions } from "@/api/transactionApi";
import { LuPlus } from "react-icons/lu";
import type { Transaction } from "@/types";

import { TransactionFormModal } from "@/components/transactions/TransactionFormModal";
import { TransactionList } from "@/components/transactions/TransactionList";
import { SearchInput } from "@/components/SearchInput";
import { BottomNav } from "@/components/layout/BottomNav";
import { DataActions } from "@/components/DataActions";
import { AppHeader } from "@/components/layout/AppHeader";
import { PageLayout } from "@/components/layout/PageLayout";
import { useTheme } from "@/hooks/useTheme";
import { useIncomeStore } from "@/store/income";
import { formatCurrency } from "@/utils";

export default function TransactionPage() {
  const { mounted } = useTheme();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [search, setSearch] = useState("");

  const { dateRange, setDateRange, totalIncome, totalTransaction } =
    useIncomeStore();

  const startStr = useMemo(
    () => dayjs(dateRange.start).startOf("day").toISOString(),
    [dateRange.start],
  );
  const endStr = useMemo(
    () => dayjs(dateRange.end).endOf("day").toISOString(),
    [dateRange.end],
  );

  // ── Fetch all transactions in the date range ────────────────────────────
  const { data, isLoading } = useQuery({
    queryKey: ["transactions-all", startStr, endStr],
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    queryFn: async () => {
      const res = await getTransactions({
        all: "true",
        start: startStr,
        end: endStr,
      });
      return res.data;
    },
  });

  // Fuse.js only runs on loaded data (when not in search mode)
  const allTx: Transaction[] = useMemo(() => {
    const raw = data?.data || [];
    return raw.map((t) => ({
      ...t,
      nominal: Number(t.nominal) || 0,
      details:
        typeof t.details === "string" ? JSON.parse(t.details) : t.details,
    }));
  }, [data]);

  // Fuse.js: only for instant local highlight when not in server-search mode
  const fuse = useMemo(
    () =>
      new Fuse(
        allTx.map((t) => ({
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
    [allTx],
  );

  // filteredTransactions: local Fuse
  const filteredTransactions = useMemo(() => {
    if (search.trim()) return fuse.search(search.trim()).map((r) => r.item);
    return allTx;
  }, [search, fuse, allTx]);

  // Total spent from the server (for the entire range)
  const totalAmount = data?.totalAmount ?? 0;

  const remaining = totalIncome - totalTransaction;

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
        maxRangeDays={90}
      />

      {/* Budget summary bar */}
      <div className="flex gap-4">
        <div
          role="button"
          tabIndex={0}
          onClick={() => navigate("/income")}
          className=" p-4 rounded-xl flex-1"
          style={{
            background: "var(--surface)",
            cursor: "pointer",
          }}
        >
          <div className="flex items-center justify-between">
            <div className="">
              <p
                className="text-[10px]"
                style={{ color: "var(--text-disabled)" }}
              >
                Sisa saldo
              </p>
              <p
                className="text-[15px] font-semibold"
                style={{
                  color: remaining < 0 ? "var(--accent)" : "var(--success)",
                }}
              >
                {formatCurrency(remaining)}
              </p>
            </div>
          </div>
        </div>
        <div
          role="button"
          tabIndex={0}
          className=" p-4 rounded-xl"
          style={{
            background: "var(--surface)",
            cursor: "pointer",
          }}
        >
          <div className="text-right">
            <p
              className="text-[10px]"
              style={{ color: "var(--text-disabled)" }}
            >
              Total transaksi
            </p>
            <p
              className="text-[13px] font-mono font-bold"
              style={{ color: "var(--accent)" }}
            >
              {formatCurrency(totalAmount)}
            </p>
          </div>
        </div>
      </div>

      {/* Data Actions (Import/Export) */}
      <DataActions dateRange={dateRange} />

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
              {search.trim()
                ? filteredTransactions.length
                : (data?.data?.length ?? 0)}
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
              <LuPlus size={12} />
              Tambah
            </button>
          </div>
        </div>
        <TransactionList transactions={filteredTransactions} />
      </div>

      {/* Add Transaction Modal */}
      <TransactionFormModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
      />

      <BottomNav />
    </PageLayout>
  );
}
