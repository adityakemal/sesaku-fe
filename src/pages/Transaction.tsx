import { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Fuse from "fuse.js";
import dayjs from "dayjs";
import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import { getTransactions } from "@/api/transactionApi";
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

const PAGE_LIMIT = 20;

export default function TransactionPage() {
  const { mounted } = useTheme();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce: only trigger server search after user stops typing 300ms
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const isSearching = debouncedSearch.length > 0;
  
  const {
    dateRange,
    setDateRange,
    totalIncome,
    totalTransaction,
  } = useIncomeStore();

  const startStr = useMemo(() => dayjs(dateRange.start).startOf("day").toISOString(), [dateRange.start]);
  const endStr = useMemo(() => dayjs(dateRange.end).endOf("day").toISOString(), [dateRange.end]);

  // ── Paginated list (no search) ──────────────────────────────────────────
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useInfiniteQuery({
      queryKey: ["transactions-paginated", startStr, endStr],
      queryFn: async ({ pageParam }) => {
        const res = await getTransactions({
          cursor: pageParam ?? undefined,
          limit: PAGE_LIMIT,
          start: startStr,
          end: endStr,
        });
        return res.data;
      },
      getNextPageParam: (lastPage) => {
        const hasMore = lastPage.hasMore === true || String(lastPage.hasMore) === "true";
        return hasMore ? lastPage.nextCursor : undefined;
      },
      initialPageParam: null as string | null,
      enabled: !isSearching, // pause when search is active
    });

  // ── Server search (pg_trgm, all matching rows) ──────────────────────────
  const { data: searchData, isLoading: isSearchLoading } = useQuery({
    queryKey: ["transactions-search", debouncedSearch, startStr, endStr],
    queryFn: async () => {
      const res = await getTransactions({ search: debouncedSearch, start: startStr, end: endStr });
      return res.data;
    },
    enabled: isSearching,
  });

  // Fuse.js only runs on loaded paginated data (when not in search mode)
  const paginatedTx: Transaction[] = useMemo(() => {
    const raw = data?.pages.flatMap((page) => page.data) || [];
    return raw.map((t) => ({
      ...t,
      nominal: Number(t.nominal) || 0,
      details: typeof t.details === "string" ? JSON.parse(t.details) : t.details,
    }));
  }, [data]);

  const serverSearchTx: Transaction[] = useMemo(() => {
    const raw = searchData?.data ?? [];
    return raw.map((t) => ({
      ...t,
      nominal: Number(t.nominal) || 0,
      details: typeof t.details === "string" ? JSON.parse(t.details) : t.details,
    }));
  }, [searchData]);

  // Active transactions shown in list
  const transactions = isSearching ? serverSearchTx : paginatedTx;

  // Fuse.js: only for instant local highlight when not in server-search mode
  const fuse = useMemo(
    () =>
      new Fuse(
        paginatedTx.map((t) => ({
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
    [paginatedTx],
  );

  // filteredTransactions: server results (isSearching) or local Fuse (typing but < debounce)
  const filteredTransactions = useMemo(() => {
    if (isSearching) return serverSearchTx;
    if (search.trim()) return fuse.search(search.trim()).map((r) => r.item);
    return paginatedTx;
  }, [isSearching, search, serverSearchTx, fuse, paginatedTx]);

  // Total spent from the server (for the entire range)
  const totalAmount = data?.pages[0]?.totalAmount ?? 0;
  
  const remaining = totalIncome - totalTransaction;
  const progress = totalIncome > 0 ? (totalTransaction / totalIncome) * 100 : 0;

  // Infinite scroll
  const loadMoreRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

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
              {/* <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-[15px] font-bold"
                style={{
                  background:
                    remaining < 0
                      ? "rgba(215,25,33,0.15)"
                      : "rgba(74,158,92,0.15)",
                  color: remaining < 0 ? "var(--accent)" : "var(--success)",
                }}
              >
                {progress > 100
                  ? "!"
                  : `${Math.min(progress, 100).toFixed(0)}%`}
              </div> */}
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
              {/* <p
                className="text-[11px]"
                style={{ color: "var(--text-secondary)" }}
              >
                dari {formatCurrency(totalIncome)}
              </p> */}
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
              {search.trim() ? filteredTransactions.length : (data?.pages[0]?.totalCount ?? 0)}
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
                <path
                  d="M6 2V10M2 6H10"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
              Tambah
            </button>
          </div>
        </div>
        <TransactionList transactions={filteredTransactions} />
        
        {/* Infinite scroll sentinel */}
        <div ref={loadMoreRef} className="py-3 flex justify-center">
          {isFetchingNextPage && (
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{
                  border: "2px solid var(--text-disabled)",
                  borderTopColor: "transparent",
                  animation: "spin 0.6s linear infinite",
                }}
              />
              <span className="text-[11px]" style={{ color: "var(--text-disabled)" }}>
                Memuat...
              </span>
            </div>
          )}
          {!hasNextPage && transactions.length > PAGE_LIMIT && (
            <p className="text-[11px]" style={{ color: "var(--text-disabled)" }}>
              Semua transaksi sudah ditampilkan
            </p>
          )}
        </div>
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
