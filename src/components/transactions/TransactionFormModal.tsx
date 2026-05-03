import { useState, useRef, useEffect, useMemo } from "react";
import Fuse from "fuse.js";
import dayjs from "dayjs";
import toast from "react-hot-toast";
import { useBudgetStore } from "@/store/budget";
import { DayPicker } from "../DatePicker";
import { useStorageStore } from "@/store/storage";
import { createCategory, getCategories } from "@/api/categoryApi";
import { ErrorModal } from "@/components/ErrorModal";
import type {
  Transaction,
  TaxItem,
  DiscountItem,
  TransactionItem,
} from "@/types";

function formatNumber(value: string): string {
  const num = value.replace(/[^0-9]/g, "");
  if (!num) return "";
  return new Intl.NumberFormat("id-ID").format(parseInt(num, 10));
}

interface TransactionFormModalProps {
  open: boolean;
  onClose: () => void;
  editData?: Transaction | null;
  ocrPrefill?: {
    name: string;
    nominal: number;
    kategori: string;
    keterangan: string;
    date: string;
    items?: { name: string; price: number }[];
  } | null;
}

export function TransactionFormModal({
  open,
  onClose,
  editData,
  ocrPrefill,
}: TransactionFormModalProps) {
  const { transactions, addTransaction, updateTransaction } = useBudgetStore();
  const listCategory = useStorageStore((s) => s.listCategory);
  const setListCat = useStorageStore((s) => s.setListCategory);
  const categories = useMemo(
    () => listCategory.map((c) => c.name),
    [listCategory],
  );
  const [modalError, setModalError] = useState("");

  const isEdit = !!editData;
  const isOcr = !!ocrPrefill;
  const now = dayjs();

  const [name, setName] = useState("");
  const [nominal, setNominal] = useState("");
  const [kategori, setKategori] = useState<string>(categories[0] || "");
  const [keterangan, setKeterangan] = useState("");
  const [date, setDate] = useState(() => now.format("YYYY-MM-DD"));
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const [items, setItems] = useState<TransactionItem[]>([]);
  const [taxes, setTaxes] = useState<TaxItem[]>([]);
  const [discounts, setDiscounts] = useState<DiscountItem[]>([]);

  const fuse = useMemo(() => {
    const cutoff = dayjs().subtract(2, "month").toISOString();
    const recentNames = [
      ...new Set(
        transactions
          .filter((t) => t.date >= cutoff && t.name)
          .map((t) => t.name),
      ),
    ];
    return new Fuse(
      recentNames.map((n) => ({ name: n })),
      { keys: ["name"], threshold: 0.4 },
    );
  }, [transactions]);

  const calcItemsTotal = items.reduce((s, i) => s + (i.price || 0), 0);
  const calcTaxTotal = taxes.reduce((s, t) => {
    if (t.type === "percent")
      return s + Math.round((calcItemsTotal * t.value) / 100);
    return s + t.value;
  }, 0);
  const calcDiscountTotal = discounts.reduce((s, d) => {
    if (d.type === "percent")
      return s + Math.round((calcItemsTotal * d.value) / 100);
    return s + d.value;
  }, 0);
  const computedTotal = calcItemsTotal + calcTaxTotal - calcDiscountTotal;

  useEffect(() => {
    if (!isEdit && computedTotal > 0 && items.length > 0) {
      setNominal(computedTotal.toString());
    }
  }, [items, taxes, discounts, isEdit, computedTotal]);

  useEffect(() => {
    if (!open) return;
    if (editData) {
      setName(editData.name || "");
      setNominal(editData.nominal.toString());
      setKategori(editData.kategori);
      setKeterangan(editData.keterangan || "");
      setDate(dayjs(editData.date).format("YYYY-MM-DD"));
      setItems(editData.details?.items || []);
      setTaxes(editData.details?.tax || []);
      setDiscounts(editData.details?.discount || []);
    } else if (ocrPrefill) {
      setName(ocrPrefill.name || "");
      setNominal(ocrPrefill.nominal.toString());
      setKategori(ocrPrefill.kategori || categories[0] || "");
      setKeterangan(ocrPrefill.keterangan || "");
      setDate(dayjs(ocrPrefill.date).format("YYYY-MM-DD"));
      setItems(ocrPrefill.items || []);
      setTaxes([]);
      setDiscounts([]);
    } else {
      setName("");
      setNominal("");
      setKategori(categories[0] || "");
      setKeterangan("");
      setDate(now.format("YYYY-MM-DD"));
      setItems([]);
      setTaxes([]);
      setDiscounts([]);
    }
    setDropdownOpen(false);
    setNewCategory("");
    setShowSuggestions(false);
    setTimeout(() => nameInputRef.current?.focus(), 50);
  }, [open, editData, ocrPrefill]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      )
        setDropdownOpen(false);
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node)
      )
        setShowSuggestions(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (categories.length > 0 && !categories.includes(kategori))
      setKategori(categories[0]);
  }, [categories, kategori]);

  const handleNominalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNominal(e.target.value.replace(/[^0-9]/g, ""));
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setName(val);
    if (val.trim().length >= 2) {
      const results = fuse
        .search(val)
        .slice(0, 5)
        .map((r) => r.item.name);
      setSuggestions(results);
      setShowSuggestions(results.length > 0);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleSubmit = () => {
    const val = parseInt(nominal.replace(/[^0-9]/g, ""), 10);
    if (val <= 0 || !kategori || !name.trim()) return;

    const selectedDate = dayjs(date);
    const dateWithTime = isEdit
      ? selectedDate
          .hour(dayjs(editData!.date).hour())
          .minute(dayjs(editData!.date).minute())
          .second(dayjs(editData!.date).second())
      : selectedDate.hour(now.hour()).minute(now.minute()).second(now.second());

    const details =
      items.length || taxes.length || discounts.length
        ? {
            items: items.length ? items : undefined,
            tax: taxes.length ? taxes : undefined,
            discount: discounts.length ? discounts : undefined,
          }
        : undefined;

    if (isEdit) {
      updateTransaction(editData!.id, {
        name: name.trim(),
        nominal: val,
        kategori,
        keterangan,
        date: dateWithTime.toISOString(),
        details,
      } as any);
      toast.success("Transaksi diperbarui");
    } else if (isOcr) {
      addTransaction({
        name: name.trim(),
        nominal: val,
        kategori,
        keterangan,
        date: dateWithTime.toISOString(),
        source: "AI",
        details,
      } as any);
      toast.success(`"${name.trim()}" ditambahkan dari scan`);
    } else {
      addTransaction({
        name: name.trim(),
        nominal: val,
        kategori,
        keterangan,
        date: dateWithTime.toISOString(),
        details,
      } as any);
      toast.success(`"${name.trim()}" ditambahkan`);
    }
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSelectCategory = (cat: string) => {
    setKategori(cat);
    setDropdownOpen(false);
  };

  const handleAddCategory = async () => {
    const trimmed = newCategory.trim();
    if (!trimmed) return;
    if (
      listCategory.some((c) => c.name.toLowerCase() === trimmed.toLowerCase())
    )
      return;
    try {
      await createCategory(trimmed);
      const res = await getCategories();
      setListCat(res.data);
    } catch (err: any) {
      setModalError(err.response?.data?.message || "Gagal menambah kategori");
      return;
    }
    setKategori(trimmed);
    setNewCategory("");
    setDropdownOpen(false);
  };

  const hasInvalidItems = items.some((i) => i.price > 0 && !i.name.trim());
  const canSubmit = nominal && kategori && name.trim() && !hasInvalidItems;

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: "rgba(0,0,0,0.6)" }}
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <div
          className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-xl"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border-visible)",
          }}
        >
          <div
            className="p-4 flex items-center justify-between sticky top-0 z-10"
            style={{
              borderBottom: "1px solid var(--border)",
              background: "var(--surface)",
            }}
          >
            <p
              className="text-[16px] font-semibold"
              style={{ color: "var(--text-display)" }}
            >
              {isOcr ? "Konfirmasi Scan Struk" : isEdit ? "Edit Transaksi" : "Tambah Transaksi"}
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

          <div className="p-5 space-y-3">
            <div
              className="space-y-3 p-3 rounded-lg"
              style={{
                border: "1px solid var(--border)",
                background: "var(--black)",
              }}
            >
              <button
                onClick={() => setItems([...items, { name: "", price: 0 }])}
                className="w-full h-8 text-[12px] font-medium rounded-lg flex items-center justify-center gap-1"
                style={{
                  border: "1px dashed var(--accent)",
                  color: "var(--accent)",
                  background: "transparent",
                }}
              >
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                  <path
                    d="M6 2V10M2 6H10"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>{" "}
                Tambah Item
              </button>
              {items.map((item, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <button
                    onClick={() => setItems(items.filter((_, j) => j !== i))}
                    className="w-7 h-7 flex items-center justify-center rounded text-red-500"
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    ×
                  </button>
                  <input
                    type="text"
                    placeholder="Nama item (wajib)"
                    value={item.name}
                    onChange={(e) => {
                      const next = [...items];
                      next[i] = { ...next[i], name: e.target.value };
                      setItems(next);
                    }}
                    className="flex-1 h-9 px-2 text-[13px] rounded-lg"
                    style={{
                      border: `1px solid ${item.price > 0 && !item.name.trim() ? "var(--accent)" : "var(--border-visible)"}`,
                      background: "var(--black)",
                      color: "var(--text-primary)",
                      outline: "none",
                    }}
                  />
                  <div className="relative flex-1">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[11px] text-[var(--text-disabled)] pointer-events-none">
                      Rp
                    </span>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="0"
                      value={
                        item.price ? formatNumber(item.price.toString()) : ""
                      }
                      onChange={(e) => {
                        const v =
                          parseInt(e.target.value.replace(/[^0-9]/g, ""), 10) ||
                          0;
                        const next = [...items];
                        next[i] = { ...next[i], price: v };
                        setItems(next);
                      }}
                      className="w-full h-9 pl-7 pr-2 text-[13px] font-bold text-right rounded-lg"
                      style={{
                        border: "1px solid var(--border-visible)",
                        background: "var(--black)",
                        color: "var(--text-primary)",
                        outline: "none",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="w-full relative" ref={suggestionsRef}>
                <label
                  className="block text-[12px] mb-1"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Nama
                </label>
                <input
                  ref={nameInputRef}
                  type="text"
                  placeholder="ex: Belanja di Toko A"
                  value={name}
                  onChange={handleNameChange}
                  onKeyDown={handleKeyDown}
                  onFocus={() => {
                    if (suggestions.length > 0 && name.trim().length >= 2)
                      setShowSuggestions(true);
                  }}
                  className="w-full h-10 px-3 text-[14px] rounded-lg"
                  style={{
                    border: "1px solid var(--border-visible)",
                    background: "var(--black)",
                    color: "var(--text-primary)",
                    boxSizing: "border-box",
                    padding: "0 12px",
                  }}
                  autoFocus
                />
                {showSuggestions && (
                  <div
                    className="absolute z-40 w-full mt-1 rounded-lg overflow-hidden"
                    style={{
                      border: "1px solid var(--border-visible)",
                      background: "var(--black)",
                      boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
                    }}
                  >
                    {suggestions.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => {
                          setName(s);
                          setShowSuggestions(false);
                        }}
                        className="w-full px-3 py-2 text-[13px] text-left"
                        style={{
                          background: "transparent",
                          color: "var(--text-primary)",
                          borderBottom: "1px solid var(--border)",
                          border: "none",
                          cursor: "pointer",
                        }}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label
                  className="block text-[12px] mb-1"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Nominal
                </label>
                <div className="relative w-full">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[12px] font-medium text-[var(--text-disabled)] pointer-events-none">
                    Rp
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="0"
                    value={nominal ? formatNumber(nominal) : ""}
                    onChange={handleNominalChange}
                    onKeyDown={handleKeyDown}
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

            <div className="grid grid-cols-2 gap-2 relative">
              <div>
                <label
                  className="block text-[12px] mb-1"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Tanggal
                </label>
                <DayPicker
                  date={date}
                  onChange={setDate}
                  className="w-full h-10"
                />
              </div>
              <div>
                <label
                  className="block text-[12px] mb-1"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Kategori
                </label>
                <div className="w-full relative" ref={dropdownRef}>
                  <button
                    type="button"
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="w-full h-10 px-3 text-[14px] cursor-pointer rounded-lg flex items-center justify-between gap-2"
                    style={{
                      border: "1px solid var(--border-visible)",
                      background: "var(--black)",
                      color: "var(--text-primary)",
                    }}
                  >
                    <span className="truncate">{kategori}</span>
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 12 12"
                      fill="none"
                      style={{
                        flexShrink: 0,
                        transform: dropdownOpen
                          ? "rotate(180deg)"
                          : "rotate(0deg)",
                        transition: "transform 0.2s",
                      }}
                    >
                      <path
                        d="M2 4L6 8L10 4"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                  {dropdownOpen && (
                    <div
                      className="absolute z-50 w-full mt-1 rounded-lg overflow-hidden"
                      style={{
                        border: "1px solid var(--border-visible)",
                        background: "var(--black)",
                        boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
                      }}
                    >
                      <div style={{ maxHeight: "200px", overflowY: "auto" }}>
                        {categories.map((k) => (
                          <button
                            key={k}
                            type="button"
                            onClick={() => handleSelectCategory(k)}
                            className="w-full px-3 py-2.5 text-[13px] text-left cursor-pointer flex items-center gap-2"
                            style={{
                              background:
                                kategori === k
                                  ? "var(--surface)"
                                  : "transparent",
                              color:
                                kategori === k
                                  ? "var(--accent)"
                                  : "var(--text-primary)",
                              borderBottom: "1px solid var(--border)",
                              fontWeight: kategori === k ? 600 : 400,
                            }}
                          >
                            {kategori === k && (
                              <svg
                                width="10"
                                height="10"
                                viewBox="0 0 10 10"
                                fill="none"
                                style={{ flexShrink: 0 }}
                              >
                                <path
                                  d="M1 5.5L3.5 8L9 2"
                                  stroke="var(--accent)"
                                  strokeWidth="1.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            )}
                            <span className="truncate">{k}</span>
                          </button>
                        ))}
                      </div>
                      <div
                        className="flex items-center gap-1.5 p-2"
                        style={{
                          borderTop: "1px solid var(--border-visible)",
                          background: "var(--surface)",
                        }}
                      >
                        <input
                          type="text"
                          placeholder="Kategori baru..."
                          value={newCategory}
                          onChange={(e) => setNewCategory(e.target.value)}
                          onKeyDown={(e) =>
                            e.key === "Enter" && handleAddCategory()
                          }
                          className="flex-1 h-8 px-2.5 text-[12px] rounded-md"
                          style={{
                            border: "1px solid var(--border-visible)",
                            background: "var(--black)",
                            color: "var(--text-primary)",
                            outline: "none",
                            minWidth: 0,
                          }}
                        />
                        <button
                          type="button"
                          onClick={handleAddCategory}
                          className="h-8 px-2.5 text-[11px] font-mono font-bold rounded-md"
                          style={{
                            background: newCategory.trim()
                              ? "var(--accent)"
                              : "var(--border)",
                            color: newCategory.trim()
                              ? "white"
                              : "var(--text-secondary)",
                            border: "none",
                            cursor: newCategory.trim() ? "pointer" : "default",
                            whiteSpace: "nowrap",
                          }}
                        >
                          + Add
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div>
              <label
                className="block text-[12px] mb-1"
                style={{ color: "var(--text-secondary)" }}
              >
                Catatan (opsional)
              </label>
              <input
                type="text"
                placeholder="Catatan..."
                value={keterangan}
                onChange={(e) => setKeterangan(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full h-10 px-3 text-[13px] rounded-lg"
                style={{
                  border: "1px solid var(--border-visible)",
                  background: "var(--black)",
                  color: "var(--text-primary)",
                  boxSizing: "border-box",
                  padding: "0 12px",
                }}
              />
            </div>

            <div
              className="space-y-3 p-3 rounded-lg"
              style={{
                border: "1px solid var(--success)",
                background: "rgba(74,158,92,0.08)",
              }}
            >
              <button
                onClick={() =>
                  setDiscounts([
                    ...discounts,
                    { name: "", value: 0, type: "percent" },
                  ])
                }
                className="w-full h-8 text-[12px] font-medium rounded-lg flex items-center justify-center gap-1"
                style={{
                  border: "1px dashed var(--success)",
                  color: "var(--success)",
                  background: "transparent",
                }}
              >
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                  <path
                    d="M6 2V10M2 6H10"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>{" "}
                Tambah Diskon
              </button>
              {discounts.map((disc, i) => (
                <div key={`d-${i}`} className="flex gap-2 items-center">
                  <input
                    type="text"
                    placeholder="Nama diskon"
                    value={disc.name}
                    onChange={(e) => {
                      const next = [...discounts];
                      next[i] = { ...next[i], name: e.target.value };
                      setDiscounts(next);
                    }}
                    className="flex-1 h-9 px-2 text-[13px] rounded-lg"
                    style={{
                      border: "1px solid var(--border-visible)",
                      background: "var(--black)",
                      color: "var(--text-primary)",
                      outline: "none",
                    }}
                  />
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="Nilai"
                    value={disc.value || ""}
                    onChange={(e) => {
                      const v =
                        parseInt(e.target.value.replace(/[^0-9]/g, ""), 10) ||
                        0;
                      const next = [...discounts];
                      next[i] = { ...next[i], value: v };
                      setDiscounts(next);
                    }}
                    className="max-w-[20%] h-9 px-2 text-[13px] font-bold text-right rounded-lg"
                    style={{
                      border: "1px solid var(--border-visible)",
                      background: "var(--black)",
                      color: "var(--text-primary)",
                      outline: "none",
                    }}
                  />
                  <select
                    value={disc.type}
                    onChange={(e) => {
                      const next = [...discounts];
                      next[i] = {
                        ...next[i],
                        type: e.target.value as "percent" | "fixed",
                      };
                      setDiscounts(next);
                    }}
                    className="max-w-[20%] h-9 px-0 text-center text-[11px] rounded-lg"
                    style={{
                      border: "1px solid var(--border-visible)",
                      background: "var(--black)",
                      color: "var(--text-primary)",
                      outline: "none",
                      padding: 0,
                    }}
                  >
                    <option value="percent">%</option>
                    <option value="fixed">Rp</option>
                  </select>
                  <button
                    onClick={() =>
                      setDiscounts(discounts.filter((_, j) => j !== i))
                    }
                    className="w-7 h-7 flex items-center justify-center rounded text-red-500"
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            <div
              className="space-y-3 p-3 rounded-lg"
              style={{
                border: "1px solid var(--warning)",
                background: "rgba(234,179,8,0.08)",
              }}
            >
              <button
                onClick={() =>
                  setTaxes([...taxes, { name: "", value: 0, type: "percent" }])
                }
                className="w-full h-8 text-[12px] font-medium rounded-lg flex items-center justify-center gap-1"
                style={{
                  border: "1px dashed var(--warning)",
                  color: "var(--warning)",
                  background: "transparent",
                }}
              >
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                  <path
                    d="M6 2V10M2 6H10"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>{" "}
                Tambah Pajak
              </button>
              {taxes.map((tax, i) => (
                <div key={`t-${i}`} className="flex gap-2 items-center">
                  <input
                    type="text"
                    placeholder="Nama pajak"
                    value={tax.name}
                    onChange={(e) => {
                      const next = [...taxes];
                      next[i] = { ...next[i], name: e.target.value };
                      setTaxes(next);
                    }}
                    className="flex-1 h-9 px-2 text-[13px] rounded-lg"
                    style={{
                      border: "1px solid var(--border-visible)",
                      background: "var(--black)",
                      color: "var(--text-primary)",
                      outline: "none",
                    }}
                  />
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="Nilai"
                    value={tax.value || ""}
                    onChange={(e) => {
                      const v =
                        parseInt(e.target.value.replace(/[^0-9]/g, ""), 10) ||
                        0;
                      const next = [...taxes];
                      next[i] = { ...next[i], value: v };
                      setTaxes(next);
                    }}
                    className="max-w-[20%] h-9 px-2 text-[13px] font-bold text-right rounded-lg"
                    style={{
                      border: "1px solid var(--border-visible)",
                      background: "var(--black)",
                      color: "var(--text-primary)",
                      outline: "none",
                    }}
                  />
                  <select
                    value={tax.type}
                    onChange={(e) => {
                      const next = [...taxes];
                      next[i] = {
                        ...next[i],
                        type: e.target.value as "percent" | "fixed",
                      };
                      setTaxes(next);
                    }}
                    className="max-w-[20%] h-9 px-0 text-center text-[11px] rounded-lg"
                    style={{
                      border: "1px solid var(--border-visible)",
                      background: "var(--black)",
                      color: "var(--text-primary)",
                      outline: "none",
                      padding: 0,
                    }}
                  >
                    <option value="percent">%</option>
                    <option value="fixed">Rp</option>
                  </select>
                  <button
                    onClick={() => setTaxes(taxes.filter((_, j) => j !== i))}
                    className="w-7 h-7 flex items-center justify-center rounded text-red-500"
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            {!isEdit && computedTotal > 0 && (
              <div className="text-center pt-1">
                <p
                  className="text-[11px]"
                  style={{ color: "var(--text-disabled)" }}
                >
                  Total kalkulasi:{" "}
                  <span
                    className="font-mono font-bold"
                    style={{ color: "var(--accent)" }}
                  >
                    Rp {formatNumber(computedTotal.toString())}
                  </span>
                </p>
              </div>
            )}

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
                {isEdit ? "Batal" : "Selesai"}
              </button>
              <button
                onClick={handleSubmit}
                disabled={!canSubmit}
                className="flex-1 h-11 font-mono text-[13px] font-bold uppercase rounded-lg disabled:opacity-50"
                style={{
                  background: canSubmit ? "var(--accent)" : "var(--border)",
                  color: canSubmit ? "white" : "var(--text-disabled)",
                  border: "none",
                }}
              >
                {isEdit ? "Simpan" : "Tambah"}
              </button>
            </div>
          </div>
        </div>
      </div>
      <ErrorModal message={modalError} onClose={() => setModalError("")} />
    </>
  );
}
