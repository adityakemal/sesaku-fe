import React, { useState } from "react";
import dayjs from "dayjs";
import toast from "react-hot-toast";
import type { Transaction } from "@/types";
import {
  LuChevronsUpDown,
  LuChevronUp,
  LuChevronDown,
  LuEllipsisVertical,
} from "react-icons/lu";
import { formatCurrency } from "@/utils";
import { useIncomeStore } from "@/store/income";
import { TransactionFormModal } from "./TransactionFormModal";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

interface TransactionListProps {
  transactions: Transaction[];
}

type SortField = "date" | "name" | "nominal" | "source" | "kategori";
type SortOrder = "asc" | "desc";

export function TransactionList({ transactions }: TransactionListProps) {
  const { deleteTransaction } = useIncomeStore();
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [deletingTx, setDeletingTx] = useState<string | null>(null);
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const hasItems = (t: Transaction) =>
    !!t.details &&
    (!!t.details.items?.length ||
      !!t.details.tax?.length ||
      !!t.details.discount?.length);

  if (transactions.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-[14px]" style={{ color: "var(--text-disabled)" }}>
          Belum ada transaksi di periode ini. <br />
          Pastikan rentang tanggal sudah sesuai ya!
        </p>
      </div>
    );
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder(field === "name" ? "asc" : "desc");
    }
  };

  const sortedTransactions = [...transactions].sort((a, b) => {
    let valA: any = a[sortField];
    let valB: any = b[sortField];

    if (sortField === "name") {
      valA = (a.name || "").toLowerCase();
      valB = (b.name || "").toLowerCase();
    }

    if (valA < valB) return sortOrder === "asc" ? -1 : 1;
    if (valA > valB) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field)
      return <LuChevronsUpDown size={12} className="opacity-30" />;
    if (sortOrder === "asc") return <LuChevronUp size={12} />;
    return <LuChevronDown size={12} />;
  };

  return (
    <div className="space-y-4">
      <div
        className="overflow-x-auto rounded-lg"
        style={{ border: "1px solid var(--border)" }}
      >
        <table
          className="w-full text-left border-collapse"
          style={{ minWidth: "500px" }}
        >
          <thead>
            <tr
              style={{
                background: "var(--surface-raised)",
                borderBottom: "1px solid var(--border)",
              }}
            >
              <th
                className="p-3 text-[12px] font-medium cursor-pointer hover:bg-white/5 transition-colors w-[80px]"
                style={{ color: "var(--text-secondary)" }}
                onClick={() => handleSort("date")}
              >
                <div className="flex items-center gap-1">
                  Tanggal <SortIcon field="date" />
                </div>
              </th>
              <th
                className="p-3 text-[12px] font-medium cursor-pointer hover:bg-white/5 transition-colors"
                style={{ color: "var(--text-secondary)" }}
                onClick={() => handleSort("name")}
              >
                <div className="flex items-center gap-1">
                  Name <SortIcon field="name" />
                </div>
              </th>
              <th
                className="p-3 text-[12px] font-medium cursor-pointer hover:bg-white/5 transition-colors"
                style={{ color: "var(--text-secondary)" }}
                onClick={() => handleSort("kategori")}
              >
                <div className="flex items-center gap-1">
                  Kategori <SortIcon field="kategori" />
                </div>
              </th>
              <th
                className="p-3 text-[12px] font-medium cursor-pointer hover:bg-white/5 transition-colors"
                style={{ color: "var(--text-secondary)" }}
                onClick={() => handleSort("source")}
              >
                <div className="flex items-center gap-1 whitespace-nowrap">
                  Added By <SortIcon field="source" />
                </div>
              </th>
              <th
                className="p-3 text-[12px] font-medium cursor-pointer hover:bg-white/5 transition-colors text-right"
                style={{ color: "var(--text-secondary)" }}
                onClick={() => handleSort("nominal")}
              >
                <div className="flex items-center justify-end gap-1">
                  Nominal <SortIcon field="nominal" />
                </div>
              </th>
              <th
                className="p-3 text-[12px] font-medium text-center w-[50px]"
                style={{ color: "var(--text-secondary)" }}
              >
                Aksi
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedTransactions.map((t, idx) => (
              <React.Fragment key={t.id}>
                <tr
                  className="group"
                  style={{
                    borderBottom:
                      idx < sortedTransactions.length - 1
                        ? "1px solid var(--border)"
                        : "none",
                    background: "var(--black)",
                  }}
                >
                  <td className="p-3 whitespace-nowrap">
                    <div className="flex flex-col">
                      <div
                        className="font-medium text-[11px]"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        {dayjs(t.date).format("DD MMM YY")}
                        <br />
                        {dayjs(t.date).format("HH:mm")}
                      </div>
                    </div>
                  </td>
                  <td className="p-3">
                    <div
                      className="flex items-center gap-1.5"
                      onClick={() => (hasItems(t) ? toggleExpand(t.id) : null)}
                    >
                      {hasItems(t) && (
                        <button
                          className="w-5 h-5 flex items-center justify-center rounded flex-shrink-0 transition-colors"
                          style={{
                            background: "none",
                            border: "none",
                            color: "var(--text-secondary)",
                            cursor: "pointer",
                          }}
                        >
                          <LuChevronDown
                            size={14}
                            style={{
                              transform: expandedRows.has(t.id)
                                ? "rotate(180deg)"
                                : "rotate(0)",
                              transition: "transform 0.2s",
                            }}
                          />
                        </button>
                      )}
                      <div>
                        <p
                          className="text-[14px] font-medium"
                          style={{ color: "var(--text-display)" }}
                        >
                          {t.name || "—"}
                        </p>
                        {t.keterangan && (
                          <div
                            className="text-[11px] truncate max-w-[150px] mt-0.5"
                            style={{ color: "var(--text-disabled)" }}
                          >
                            {t.keterangan}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="p-3">
                    <span
                      className="px-1.5 py-px rounded text-[10px] font-mono"
                      style={{
                        background: "var(--surface)",
                        color: "var(--text-secondary)",
                      }}
                    >
                      {t.kategori}
                    </span>
                  </td>
                  <td className="p-3">
                    <span
                      className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase"
                      style={{
                        background:
                          t.source === "AI"
                            ? "rgba(91,155,246,0.15)"
                            : "rgba(74,158,92,0.15)",
                        color:
                          t.source === "AI"
                            ? "rgba(91,155,246,0.9)"
                            : "rgba(74,158,92,0.9)",
                      }}
                    >
                      {t.source || "Web"}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <span
                      className="text-[13px] font-mono font-bold whitespace-nowrap"
                      style={{ color: "var(--accent)" }}
                    >
                      {formatCurrency(t.nominal)}
                    </span>
                  </td>
                  <td className="p-3 relative">
                    <div className="flex items-center justify-center">
                      <button
                        onClick={() =>
                          setActionMenuOpen(
                            actionMenuOpen === t.id ? null : t.id,
                          )
                        }
                        className="w-7 h-7 flex items-center justify-center rounded transition-colors hover:bg-white/10"
                        style={{
                          background: "none",
                          border: "none",
                          color: "var(--text-secondary)",
                          cursor: "pointer",
                        }}
                      >
                        <LuEllipsisVertical size={16} />
                      </button>
                    </div>
                    {actionMenuOpen === t.id && (
                      <>
                        <div
                          className="fixed inset-0 z-40"
                          onClick={() => setActionMenuOpen(null)}
                        />
                        <div
                          className="absolute right-8 top-1/2 -translate-y-1/2 w-28 rounded-lg shadow-xl z-50 overflow-hidden"
                          style={{
                            background: "var(--surface-raised)",
                            border: "1px solid var(--border-visible)",
                          }}
                        >
                          <button
                            onClick={() => {
                              setEditingTx(t);
                              setActionMenuOpen(null);
                            }}
                            className="w-full px-3 py-2 text-left text-[12px] font-medium transition-colors hover:bg-white/5"
                            style={{
                              color: "var(--text-primary)",
                              borderBottom: "1px solid var(--border)",
                            }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => {
                              setDeletingTx(t.id);
                              setActionMenuOpen(null);
                            }}
                            className="w-full px-3 py-2 text-left text-[12px] font-bold transition-colors hover:bg-white/5"
                            style={{ color: "var(--accent)" }}
                          >
                            Hapus
                          </button>
                        </div>
                      </>
                    )}
                  </td>
                </tr>
                {expandedRows.has(t.id) && t.details && (
                  <tr style={{ background: "var(--surface-raised)" }}>
                    <td colSpan={6} className="p-3">
                      <div className="space-y-2 text-[12px]">
                        {t.details.items && t.details.items.length > 0 && (
                          <div>
                            <p
                              className="font-semibold mb-1"
                              style={{ color: "var(--text-display)" }}
                            >
                              Items
                            </p>
                            {t.details.items.map((item, i) => (
                              <div
                                key={i}
                                className="flex justify-between items-center py-0.5 max-w-xs md:max-w-full gap-4"
                                style={{
                                  borderBottom: "1px solid var(--border)",
                                }}
                              >
                                <span
                                  style={{ color: "var(--text-secondary)" }}
                                >
                                  {item.name}
                                </span>
                                <span
                                  className="font-mono whitespace-nowrap"
                                  style={{ color: "var(--text-primary)" }}
                                >
                                  Rp {item.price.toLocaleString("id-ID")}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                        {t.details.tax && t.details.tax.length > 0 && (
                          <div>
                            <p
                              className="font-semibold mb-1"
                              style={{ color: "var(--warning)" }}
                            >
                              Biaya Tambahan
                            </p>
                            {t.details.tax.map((tx, i) => (
                              <div
                                key={i}
                                className="flex justify-between py-0.5 max-w-xs md:max-w-full"
                                style={{
                                  borderBottom: "1px solid var(--border)",
                                }}
                              >
                                <span
                                  style={{ color: "var(--text-secondary)" }}
                                >
                                  {tx.name}
                                </span>
                                <span
                                  className="font-mono"
                                  style={{ color: "var(--warning)" }}
                                >
                                  {tx.type === "percent"
                                    ? `${tx.value}%`
                                    : `Rp ${tx.value.toLocaleString("id-ID")}`}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                        {t.details.discount &&
                          t.details.discount.length > 0 && (
                            <div>
                              <p
                                className="font-semibold mb-1"
                                style={{ color: "var(--success)" }}
                              >
                                Diskon
                              </p>
                              {t.details.discount.map((d, i) => (
                                <div
                                  key={i}
                                  className="flex justify-between py-0.5 max-w-xs md:max-w-full"
                                  style={{
                                    borderBottom: "1px solid var(--border)",
                                  }}
                                >
                                  <span
                                    style={{ color: "var(--text-secondary)" }}
                                  >
                                    {d.name}
                                  </span>
                                  <span
                                    className="font-mono"
                                    style={{ color: "var(--success)" }}
                                  >
                                    -
                                    {d.type === "percent"
                                      ? `${d.value}%`
                                      : `Rp ${d.value.toLocaleString("id-ID")}`}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {editingTx && (
        <TransactionFormModal
          open={!!editingTx}
          editData={editingTx}
          onClose={() => setEditingTx(null)}
        />
      )}

      {deletingTx && (
        <ConfirmModal
          open={!!deletingTx}
          title="Hapus Transaksi"
          description="Yakin ingin menghapus transaksi ini? Data yang dihapus tidak dapat dikembalikan."
          confirmText="Hapus"
          onConfirm={() => {
            deleteTransaction(deletingTx);
            setDeletingTx(null);
            toast.success("Transaksi dihapus");
          }}
          onClose={() => setDeletingTx(null)}
        />
      )}
    </div>
  );
}
