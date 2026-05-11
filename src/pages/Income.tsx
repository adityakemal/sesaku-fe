import { useState, useEffect } from "react";
import dayjs from "dayjs";
import toast from "react-hot-toast";
import { AppHeader } from "@/components/layout/AppHeader";
import { BottomNav } from "@/components/layout/BottomNav";
import { PageLayout } from "@/components/layout/PageLayout";
import {
  DayPicker,
  DateRangePicker,
  type DateRange,
} from "@/components/DatePicker";
import { useIncomeStore } from "@/store/income";
import { LuPlus, LuEllipsisVertical } from "react-icons/lu";
import { formatCurrency } from "@/utils";
import type { IncomeEntry } from "@/types";

export default function IncomePage() {
  const {
    incomeEntries,
    addIncomeEntry,
    updateIncomeEntry,
    deleteIncomeEntry,
  } = useIncomeStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [addKey, setAddKey] = useState(0);
  const [editingEntry, setEditingEntry] = useState<IncomeEntry | null>(null);
  const [deletingEntry, setDeletingEntry] = useState<IncomeEntry | null>(null);
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);
  const [filterRange, setFilterRange] = useState<DateRange | null>(null);

  const monthEntries = filterRange
    ? incomeEntries.filter((e) => {
        const d = dayjs(e.date);
        return (
          d.isAfter(dayjs(filterRange.start).subtract(1, "day")) &&
          d.isBefore(dayjs(filterRange.end).add(1, "day"))
        );
      })
    : incomeEntries;
  const totalIncome = monthEntries.reduce((sum, e) => sum + e.amount, 0);

  const handleDelete = () => {
    if (!deletingEntry) return;
    deleteIncomeEntry(deletingEntry.id);
    toast.success("Income dihapus");
    setDeletingEntry(null);
  };

  return (
    <PageLayout>
      <AppHeader
        title="Income"
        isShowDatepicker={false}
        rightSlot={
          <div className="flex items-center justify-end">
            <DateRangePicker
              range={filterRange}
              onChange={setFilterRange}
              placeholder="Semua Income"
              onClear={() => setFilterRange(null)}
            />
          </div>
        }
      />

      <div
        className="p-4 rounded-xl space-y-4"
        style={{ background: "var(--surface)" }}
      >
        <div className="flex items-center justify-between flex-wrap gap-2">
          <p
            className="text-[16px] font-mono font-bold"
            style={{ color: "var(--accent)" }}
          >
            {formatCurrency(totalIncome)}
          </p>
          <button
            onClick={() => {
              setShowAddModal(true);
              setAddKey((k) => k + 1);
            }}
            className="h-8 px-3 text-[12px] font-bold rounded-lg flex items-center gap-1.5 transition-opacity hover:opacity-80"
            style={{
              background: "var(--accent)",
              color: "white",
              border: "none",
            }}
          >
            <LuPlus size={16} />
            Tambah
          </button>
        </div>

        {monthEntries.length === 0 ? (
          <div className="text-center py-8">
            <p
              className="text-[13px]"
              style={{ color: "var(--text-disabled)" }}
            >
              Belum ada income di bulan ini.
            </p>
          </div>
        ) : (
          <div
            className="overflow-x-auto rounded-xl"
            style={{ border: "1px solid var(--border)" }}
          >
            <table
              className="w-full text-left border-collapse"
              // style={{ minWidth: "450px" }}
            >
              <thead>
                <tr
                  style={{
                    background: "var(--surface-raised)",
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  <th
                    className="p-3 text-[12px] font-medium"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Bulan
                  </th>
                  <th
                    className="p-3 text-[12px] font-medium"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Nominal
                  </th>
                  {/* <th
                    className="p-3 text-[12px] font-medium"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Catatan
                  </th> */}

                  <th
                    className="p-3 text-[12px] font-medium text-center w-[50px]"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody>
                {monthEntries.map((entry, idx) => (
                  <tr
                    key={entry.id}
                    style={{
                      borderBottom:
                        idx < monthEntries.length - 1
                          ? "1px solid var(--border)"
                          : "none",
                      background: "var(--black)",
                    }}
                  >
                    <td className="p-3 whitespace-nowrap">
                      <span
                        className="text-[12px]"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        {dayjs(entry.date).format("DD MMM YY")}
                        <br />
                        {dayjs(entry.date).format("HH:mm")}
                      </span>
                    </td>
                    <td className="p-3">
                      <p
                        className="text-[13px] font-mono font-bold"
                        style={{ color: "var(--accent)" }}
                      >
                        {formatCurrency(entry.amount)}
                      </p>
                      <span
                        className="text-[12px]"
                        style={{
                          color: entry.note
                            ? "var(--text-secondary)"
                            : "var(--text-disabled)",
                        }}
                      >
                        {entry.note || "—"}
                      </span>
                    </td>
                    {/* <td className="p-3">
                      <span
                        className="text-[12px]"
                        style={{
                          color: entry.note
                            ? "var(--text-secondary)"
                            : "var(--text-disabled)",
                        }}
                      >
                        {entry.note || "—"}
                      </span>
                    </td> */}

                    <td className="p-3 relative">
                      <div className="flex items-center justify-center">
                        <button
                          onClick={() =>
                            setActionMenuOpen(
                              actionMenuOpen === entry.id ? null : entry.id,
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
                      {actionMenuOpen === entry.id && (
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
                                setEditingEntry(entry);
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
                                setDeletingEntry(entry);
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
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showAddModal && (
        <IncomeModal
          key={`add-${addKey}`}
          onSave={async (data) => {
            await addIncomeEntry({
              date: data.date,
              amount: data.amount,
              note: data.note,
            });
            toast.success("Income ditambahkan");
            setShowAddModal(false);
          }}
          onClose={() => setShowAddModal(false)}
        />
      )}

      {editingEntry && (
        <IncomeModal
          key={editingEntry.id}
          entry={editingEntry}
          onSave={(data) => {
            updateIncomeEntry(editingEntry.id, {
              amount: data.amount,
              note: data.note,
              date: data.date,
            } as any);
            toast.success("Income diperbarui");
            setEditingEntry(null);
          }}
          onClose={() => setEditingEntry(null)}
        />
      )}

      {deletingEntry && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.6)" }}
          onClick={(e) =>
            e.target === e.currentTarget && setDeletingEntry(null)
          }
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
                Hapus Income
              </p>
            </div>
            <div className="p-5 text-center">
              <p
                className="text-[14px]"
                style={{ color: "var(--text-secondary)" }}
              >
                Yakin ingin menghapus income{" "}
                <span className="font-bold" style={{ color: "var(--accent)" }}>
                  {formatCurrency(deletingEntry.amount)}
                </span>
                ?
              </p>
            </div>
            <div
              className="p-4 flex gap-3"
              style={{ borderTop: "1px solid var(--border)" }}
            >
              <button
                onClick={handleDelete}
                className="flex-1 h-10 text-[13px] font-bold rounded-lg"
                style={{
                  background: "var(--accent)",
                  color: "white",
                  border: "none",
                }}
              >
                Hapus
              </button>
              <button
                onClick={() => setDeletingEntry(null)}
                className="flex-1 h-10 text-[13px] font-medium rounded-lg"
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

function IncomeModal({
  entry,
  onSave,
  onClose,
}: {
  entry?: IncomeEntry;
  onSave: (data: { date: string; amount: number; note: string }) => void;
  onClose: () => void;
}) {
  const isEdit = !!entry;
  const [date, setDate] = useState(() =>
    entry
      ? dayjs(entry.date).format("YYYY-MM-DD")
      : dayjs().format("YYYY-MM-DD"),
  );
  const [nominal, setNominal] = useState(entry ? entry.amount.toString() : "");
  const [note, setNote] = useState(entry ? entry.note || "" : "");

  useEffect(() => {
    if (entry) {
      setDate(dayjs(entry.date).format("YYYY-MM-DD"));
      setNominal(entry.amount.toString());
      setNote(entry.note || "");
    } else {
      setDate(dayjs().format("YYYY-MM-DD"));
      setNominal("");
      setNote("");
    }
  }, [entry]);

  const formatInput = (value: string) => {
    const num = value.replace(/[^0-9]/g, "");
    if (!num) return "";
    return new Intl.NumberFormat("id-ID").format(parseInt(num, 10));
  };

  const handleSave = () => {
    const val = parseInt(nominal.replace(/[^0-9]/g, ""), 10);
    if (!val || val <= 0) return;
    const budgetDate = dayjs(date)
      .hour(dayjs().hour())
      .minute(dayjs().minute())
      .second(dayjs().second())
      .toISOString();
    onSave({ date: budgetDate, amount: val, note: note.trim() });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.6)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-md rounded-xl"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border-visible)",
        }}
      >
        <div
          className="p-4 flex items-center justify-between"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <p
            className="text-[16px] font-semibold"
            style={{ color: "var(--text-display)" }}
          >
            {isEdit ? "Edit Income" : "Tambah Income"}
          </p>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-[18px]"
            style={{
              border: "1px solid var(--border-visible)",
              color: "var(--text-secondary)",
              background: "transparent",
            }}
          >
            ×
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex gap-2">
            <div className="w-[140px]">
              <label
                className="block text-[12px] mb-1"
                style={{ color: "var(--text-secondary)" }}
              >
                Bulan
              </label>
              <DayPicker
                date={date}
                onChange={setDate}
                className="w-full h-10"
              />
            </div>
            <div className="flex-1">
              <label
                className="block text-[12px] mb-1"
                style={{ color: "var(--text-secondary)" }}
              >
                Nominal
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[12px] font-medium text-[var(--text-disabled)] pointer-events-none">
                  Rp
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={formatInput(nominal)}
                  onChange={(e) =>
                    setNominal(e.target.value.replace(/[^0-9]/g, ""))
                  }
                  className="w-full h-10 pl-8 pr-3 text-[14px] font-bold text-right rounded-lg"
                  style={{
                    border: nominal
                      ? "2px solid var(--accent)"
                      : "1px solid var(--border-visible)",
                    background: "var(--black)",
                    color: nominal ? "var(--accent)" : "var(--text-display)",
                    boxSizing: "border-box",
                    padding: "0 12px 0 32px",
                  }}
                />
              </div>
            </div>
          </div>

          <div>
            <label
              className="block text-[12px] mb-1"
              style={{ color: "var(--text-secondary)" }}
            >
              Catatan
            </label>
            <input
              type="text"
              placeholder="Gaji, Freelance, dll..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full h-10 px-3 text-[14px] rounded-lg"
              style={{
                border: "1px solid var(--border-visible)",
                background: "var(--black)",
                color: "var(--text-primary)",
                boxSizing: "border-box",
                padding: "0 12px",
              }}
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={onClose}
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
              disabled={!nominal}
              className="flex-1 h-11 text-[13px] font-bold rounded-lg disabled:opacity-50"
              style={{
                background: "var(--accent)",
                color: "white",
                border: "none",
              }}
            >
              Simpan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
