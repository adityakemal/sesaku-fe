import { useState, useEffect, useRef, useMemo } from "react";
import dayjs from "dayjs";
import { DayPicker } from "../DatePicker";
import { useStorageStore } from "@/store/storage";
import { getCategories, createCategory } from "@/api/categoryApi";
import { ErrorModal } from "@/components/ErrorModal";
import { LuChevronDown, LuCheck } from "react-icons/lu";

interface OcrConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  ocrData: any;
  onSave: (transactions: any[]) => void;
}

export function OcrConfirmationModal({
  isOpen,
  onClose,
  ocrData,
  onSave,
}: OcrConfirmationModalProps) {
  const listCategory = useStorageStore((s) => s.listCategory);
  const setListCat = useStorageStore((s) => s.setListCategory);
  const categories = useMemo(
    () => listCategory.map((c) => c.name),
    [listCategory],
  );
  const [modalError, setModalError] = useState("");

  const [mode, setMode] = useState<"summary" | "detail">("summary");
  const [items, setItems] = useState<any[]>([]);
  const [transactionDate, setTransactionDate] = useState<string>(() =>
    dayjs().format("YYYY-MM-DD"),
  );

  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [newCat, setNewCat] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);
  const [showDateWarning, setShowDateWarning] = useState(false);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpenDropdownId(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const formatInput = (value: string) => {
    const num = value.replace(/[^0-9]/g, "");
    if (!num) return "";
    return new Intl.NumberFormat("id-ID").format(parseInt(num, 10));
  };

  const handleAddCat = async (itemId: string) => {
    const trimmed = newCat.trim();
    if (trimmed) {
      const exists = listCategory.some((c) => c.name.toLowerCase() === trimmed.toLowerCase());
      if (!exists) {
        try {
          await createCategory(trimmed);
          const res = await getCategories();
          setListCat(res.data);
        } catch (err: any) {
          setModalError(err.response?.data?.message || "Gagal menambah kategori");
          return;
        }
      }
      handleItemChange(itemId, "kategori", trimmed);
      setNewCat("");
      setOpenDropdownId(null);
    }
  };

  useEffect(() => {
    if (ocrData) {
      if (ocrData.date) {
        const parsedDate = dayjs(ocrData.date);
        if (parsedDate.isValid()) {
          setTransactionDate(parsedDate.format("YYYY-MM-DD"));
        }
      }

      if (mode === "summary") {
        const nominal =
          ocrData.total_amount > 0
            ? ocrData.total_amount
            : ocrData.totalData?.price || 0;
        const name =
          ocrData.supplier && ocrData.supplier !== "Unknown"
            ? `Transaksi ${ocrData.supplier}`
            : ocrData.totalData?.name || "OCR Transaction";

        setItems([
          {
            id: crypto.randomUUID(),
            name,
            nominal,
            kategori: ocrData.purchase_category || categories[0] || "Lainnya",
            keterangan: "Hasil Scan Struk",
          },
        ]);
      } else {
        const detailItems = ocrData.items?.length > 0 ? ocrData.items : [];
        const mapped = detailItems.map((item: any) => ({
          id: crypto.randomUUID(),
          name: item.name,
          nominal: item.price,
          kategori: ocrData.purchase_category || categories[0] || "Lainnya",
          keterangan: "Item Struk",
        }));

        if (mapped.length === 0) {
          // Fallback jika tidak ada items terdeteksi
          const nominal =
            ocrData.total_amount > 0
              ? ocrData.total_amount
              : ocrData.totalData?.price || 0;
          const name =
            ocrData.supplier && ocrData.supplier !== "Unknown"
              ? `Transaksi ${ocrData.supplier}`
              : ocrData.totalData?.name || "OCR Transaction";
          mapped.push({
            id: crypto.randomUUID(),
            name,
            nominal,
            kategori: ocrData.purchase_category || categories[0] || "Lainnya",
            keterangan: "Hasil Scan Struk",
          });
        }
        setItems(mapped);
      }
    }
  }, [ocrData, mode, categories]);

  if (!isOpen || !ocrData) return null;

  const handleItemChange = (
    id: string,
    field: string,
    value: string | number,
  ) => {
    setItems(
      items.map((item) =>
        item.id === id ? { ...item, [field]: value } : item,
      ),
    );
  };

  const handleConfirmDelete = () => {
    if (deletingItemId) {
      setItems(items.filter((item) => item.id !== deletingItemId));
      setDeletingItemId(null);
    }
  };

  const executeSave = () => {
    let txDate = dayjs().toISOString();
    const parsedDate = dayjs(transactionDate);
    if (parsedDate.isValid()) {
      txDate = parsedDate
        .hour(dayjs().hour())
        .minute(dayjs().minute())
        .second(dayjs().second())
        .toISOString();
    }

    const transactionsToSave = items.map((item) => ({
      name: item.name,
      nominal:
        typeof item.nominal === "string"
          ? parseInt(item.nominal, 10) || 0
          : item.nominal,
      kategori: item.kategori,
      keterangan: item.keterangan,
      date: txDate,
      source: "AI", // sesuai kebutuhan added by AI
    }));

    onSave(transactionsToSave);
  };

  const handleSaveClick = () => {
    const today = dayjs().format("YYYY-MM-DD");
    if (transactionDate !== today) {
      setShowDateWarning(true);
    } else {
      executeSave();
    }
  };

  return (
    <>
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.6)" }}
    >
      <div
        className="w-full max-w-xl max-h-[90dvh] flex flex-col rounded-xl overflow-hidden shadow-2xl relative"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border-visible)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* <div
          className="flex items-center justify-between p-4"
          style={{ borderBottom: "1px solid var(--border-visible)" }}
        >
          <h2
            className="text-[16px] font-semibold"
            style={{ color: "var(--text-display)" }}
          >
            Konfirmasi Hasil Scan
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-[18px]"
            style={{
              border: "1px solid var(--border-visible)",
              color: "var(--text-secondary)",
              background: "transparent",
            }}
          >
            &times;
          </button>
        </div> */}

        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
          {/* Toggle Mode */}
          <div className="flex bg-[var(--surface)] p-1 rounded-lg sticky top-0 z-10 border ">
            <button
              className={`flex-1 py-2 text-[13px] font-medium rounded-md transition-all ${
                mode === "summary"
                  ? "bg-[var(--accent)] text-white"
                  : "text-[var(--text-secondary)]"
              }`}
              onClick={() => setMode("summary")}
            >
              Simpan Bulk
            </button>
            <button
              className={`flex-1 py-2 text-[13px] font-medium rounded-md transition-all ${
                mode === "detail"
                  ? "bg-[var(--accent)] text-white"
                  : "text-[var(--text-secondary)]"
              }`}
              onClick={() => setMode("detail")}
            >
              Simpan Per Item
            </button>
          </div>

          <div className="flex flex-col gap-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-lg flex flex-col gap-3 relative"
                style={{
                  border: "1px solid var(--border-visible)",
                  background: "var(--surface)",
                }}
              >
                <div className="flex justify-between items-center">
                  <span
                    className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase"
                    style={{
                      background: "rgba(91,155,246,0.15)",
                      color: "rgba(91,155,246,0.9)",
                    }}
                  >
                    AI
                  </span>
                  {mode !== "summary" && (
                    <button
                      onClick={() => setDeletingItemId(item.id)}
                      className="text-[12px] text-red-500 font-medium"
                    >
                      Hapus
                    </button>
                  )}
                </div>

                {/* Row 1: Nama & Nominal */}
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label
                      className="block text-[11px] mb-1"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      Nama
                    </label>
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) =>
                        handleItemChange(item.id, "name", e.target.value)
                      }
                      className="w-full h-9 px-2.5 text-[13px] rounded-lg"
                      style={{
                        border: "1px solid var(--border-visible)",
                        background: "var(--black)",
                        color: "var(--text-primary)",
                        outline: "none",
                      }}
                    />
                  </div>
                  <div className="w-[120px]">
                    <label
                      className="block text-[11px] mb-1"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      Nominal
                    </label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] font-medium text-[var(--text-disabled)] pointer-events-none">
                        Rp
                      </span>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={formatInput(item.nominal.toString())}
                        onChange={(e) =>
                          handleItemChange(
                            item.id,
                            "nominal",
                            e.target.value.replace(/[^0-9]/g, ""),
                          )
                        }
                        className="w-full h-9 pl-7 pr-2.5 text-[13px] font-bold text-right rounded-lg"
                        style={{
                          border: "1px solid var(--border-visible)",
                          background: "var(--black)",
                          color: "var(--text-display)",
                          outline: "none",
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Row 2: Kategori & Keterangan */}
                <div className="flex gap-2">
                  <div
                    className="w-[120px] relative"
                    ref={openDropdownId === item.id ? dropdownRef : null}
                  >
                    <label
                      className="block text-[11px] mb-1"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      Kategori
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        setOpenDropdownId(
                          openDropdownId === item.id ? null : item.id,
                        )
                      }
                      className="w-full h-9 px-2.5 text-[12px] cursor-pointer rounded-lg flex items-center justify-between gap-1"
                      style={{
                        border: "1px solid var(--border-visible)",
                        background: "var(--black)",
                        color: "var(--text-primary)",
                      }}
                    >
                      <span className="truncate">{item.kategori}</span>
                      <LuChevronDown
                        size={14}
                        style={{
                          flexShrink: 0,
                          transform:
                            openDropdownId === item.id
                              ? "rotate(180deg)"
                              : "rotate(0deg)",
                          transition: "transform 0.2s ease",
                        }}
                      />
                    </button>

                    {openDropdownId === item.id && (
                      <div
                        className="absolute z-50 w-[180px] mt-1 rounded-lg overflow-hidden"
                        style={{
                          border: "1px solid var(--border-visible)",
                          background: "var(--black)",
                          boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
                        }}
                      >
                        <div style={{ maxHeight: "150px", overflowY: "auto" }}>
                          {categories.map((k) => (
                            <button
                              key={k}
                              type="button"
                              onClick={() => {
                                handleItemChange(item.id, "kategori", k);
                                setOpenDropdownId(null);
                              }}
                              className="w-full px-3 py-2 text-[12px] text-left cursor-pointer flex items-center gap-2"
                              style={{
                                background:
                                  item.kategori === k
                                    ? "var(--surface)"
                                    : "transparent",
                                color:
                                  item.kategori === k
                                    ? "var(--accent)"
                                    : "var(--text-primary)",
                                borderBottom: "1px solid var(--border)",
                                fontWeight: item.kategori === k ? 600 : 400,
                              }}
                            >
                              {item.kategori === k && (
                                <LuCheck size={14} color="var(--accent)" style={{ flexShrink: 0 }} />
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
                            value={newCat}
                            onChange={(e) => setNewCat(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleAddCat(item.id);
                              }
                            }}
                            className="flex-1 h-8 px-2.5 text-[11px] rounded-md"
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
                            onClick={() => handleAddCat(item.id)}
                            className="h-8 px-2 text-[10px] font-mono font-bold rounded-md"
                            style={{
                              background: newCat.trim()
                                ? "var(--accent)"
                                : "var(--border)",
                              color: newCat.trim()
                                ? "white"
                                : "var(--text-secondary)",
                              border: "none",
                              cursor: newCat.trim() ? "pointer" : "default",
                              whiteSpace: "nowrap",
                            }}
                          >
                            + Add
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <label
                      className="block text-[11px] mb-1"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      Keterangan
                    </label>
                    <input
                      type="text"
                      value={item.keterangan}
                      onChange={(e) =>
                        handleItemChange(item.id, "keterangan", e.target.value)
                      }
                      className="w-full h-9 px-2.5 text-[13px] rounded-lg"
                      style={{
                        border: "1px solid var(--border-visible)",
                        background: "var(--black)",
                        color: "var(--text-primary)",
                        outline: "none",
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}

            {items.length === 0 && (
              <div className="flex items-center justify-center py-8">
                <p
                  className="text-[13px] text-center"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Tidak ada data. Silakan ganti mode.
                </p>
              </div>
            )}
          </div>

          {/* Global Date Picker */}
          {items.length > 0 && (
            <div
              className="mt-1 p-3 rounded-lg flex flex-col gap-1"
              style={{
                border: "1px dashed var(--accent)",
                background: "rgba(91,155,246, 0.08)",
              }}
            >
              <label
                className="block text-[12px] font-semibold"
                style={{ color: "var(--accent)" }}
              >
                Atur Tanggal Transaksi
              </label>
              <DayPicker
                date={transactionDate}
                onChange={setTransactionDate}
                className="w-full h-10"
              />
            </div>
          )}
        </div>

        <div
          className="p-4 flex gap-3"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          <button
            onClick={onClose}
            className="flex-1 h-11 text-[13px] font-medium rounded-lg"
            style={{
              border: "1px solid var(--border-visible)",
              color: "var(--text-primary)",
              background: "transparent",
            }}
          >
            Batal
          </button>
          <button
            onClick={handleSaveClick}
            disabled={items.length === 0}
            className="flex-1 h-11 text-[13px] font-bold rounded-lg disabled:opacity-50"
            style={{ background: "var(--accent)", color: "white" }}
          >
            Simpan ({items.length})
          </button>
        </div>
      </div>

      {deletingItemId && (
        <DeleteConfirmModal
          itemName={items.find(i => i.id === deletingItemId)?.name || "Item"}
          itemNominal={items.find(i => i.id === deletingItemId)?.nominal || 0}
          onConfirm={handleConfirmDelete}
          onClose={() => setDeletingItemId(null)}
        />
      )}

      {showDateWarning && (
        <DateWarningModal
          selectedDate={transactionDate}
          onConfirm={() => {
            setShowDateWarning(false);
            executeSave();
          }}
          onClose={() => setShowDateWarning(false)}
        />
      )}
    </div>

    <ErrorModal message={modalError} onClose={() => setModalError("")} />
    </>
  );
}

function DateWarningModal({
  selectedDate,
  onConfirm,
  onClose,
}: {
  selectedDate: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const formattedDate = dayjs(selectedDate).format("DD MMM YYYY");

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.6)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
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
            className="text-[16px] font-semibold text-center text-yellow-500"
          >
            Peringatan Tanggal
          </p>
        </div>

        <div className="p-5 text-center">
          <p className="text-[14px]" style={{ color: "var(--text-secondary)" }}>
            Anda akan menyimpan transaksi ini di tanggal<br/>
            <span className="font-bold text-[var(--text-primary)] text-[16px] block my-2">
              {formattedDate}
            </span>
            Tanggal ini berbeda dengan hari ini. Lanjutkan menyimpan?
          </p>
        </div>

        <div
          className="p-4 flex gap-3"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          <button
            onClick={onConfirm}
            className="flex-1 h-10 text-[13px] font-bold rounded-lg"
            style={{
              background: "var(--accent)",
              color: "white",
              border: "none",
            }}
          >
            Ya, Simpan
          </button>
          <button
            onClick={onClose}
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

  );
}

function DeleteConfirmModal({
  itemName,
  itemNominal,
  onConfirm,
  onClose,
}: {
  itemName: string;
  itemNominal: number;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const formattedNominal = new Intl.NumberFormat("id-ID").format(itemNominal);

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.6)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
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
            Hapus Transaksi
          </p>
        </div>

        <div className="p-5 text-center">
          <p className="text-[14px]" style={{ color: "var(--text-secondary)" }}>
            Yakin ingin menghapus item transaksi{" "}
            <span className="font-bold text-[var(--text-primary)]">"{itemName}"</span>{" "}
            sebesar{" "}
            <span className="font-bold text-[var(--accent)]">Rp {formattedNominal}</span>?
            <br />
            Data yang dihapus tidak dapat dikembalikan.
          </p>
        </div>

        <div
          className="p-4 flex gap-3"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          <button
            onClick={onConfirm}
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
            onClick={onClose}
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

  );
}