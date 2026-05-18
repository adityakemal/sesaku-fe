import { useRef, useState } from "react";
import Papa from "papaparse";
import dayjs from "dayjs";
import toast from "react-hot-toast";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { LuChevronDown, LuScan, LuDownload, LuX } from "react-icons/lu";
import { useIncomeStore } from "@/store/income";
import { useStorageStore } from "@/store/storage";
import type { Transaction } from "@/types";
import { DateRangePicker, type DateRange } from "@/components/DatePicker";
import { TransactionFormModal } from "./transactions/TransactionFormModal";
import { scanReceipt } from "@/api/ocrApi";
import { getTransactions } from "@/api/transactionApi";

interface DataActionsProps {
  dateRange?: DateRange;
}

export function DataActions({ dateRange }: DataActionsProps) {
  const { transactions, importData } = useIncomeStore();
  const user = useStorageStore((s) => s.user);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const ocrInputRef = useRef<HTMLInputElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [ocrPrefill, setOcrPrefill] = useState<any>(null);
  const [isOcrModalOpen, setIsOcrModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportRange, setExportRange] = useState<DateRange | null>(
    dateRange ?? null,
  );

  const downloadCSV = (data: any[], filename: string) => {
    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    link.style.display = "none";

    document.body.appendChild(link);
    link.click();

    setTimeout(() => {
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    }, 100);
  };

  const handleDownloadTemplate = () => {
    const template = [
      {
        name: "Makan siang",
        nominal: 25000,
        kategori: "Makanan",
        keterangan: "Nasi padang",
        date: dayjs().format("DD/MM/YYYY"),
        items: "Nasi: 15000 | Ayam: 10000",
        tax: "PB1: 10%",
        discount: "",
      },
    ];
    downloadCSV(template, "template_transaksi.csv");
  };

  const handleExport = async () => {
    if (!exportRange) return;
    setExportModalOpen(false);
    setIsExporting(true);
    try {
      const res = await getTransactions({
        all: "true",
        start: dayjs(exportRange.start).startOf("day").toISOString(),
        end: dayjs(exportRange.end).endOf("day").toISOString(),
      });
      const allTx = res.data.data ?? [];

      const csv = allTx.map((t) => {
        const base = {
          name: t.name,
          nominal: t.nominal,
          kategori: t.kategori,
          keterangan: t.keterangan || "",
          date: t.date,
          source: t.source || "Web",
        };
        const details =
          typeof t.details === "string" ? JSON.parse(t.details) : t.details;
        if (details?.items?.length) {
          return {
            ...base,
            items: details.items
              .map((i: any) => `${i.name}: ${i.price}`)
              .join(" | "),
            tax:
              details.tax
                ?.map(
                  (tx: any) =>
                    `${tx.name}: ${
                      tx.type === "percent" ? tx.value + "%" : tx.value
                    }`,
                )
                .join(" | ") || "",
            discount:
              details.discount
                ?.map(
                  (d: any) =>
                    `${d.name}: ${
                      d.type === "percent" ? d.value + "%" : d.value
                    }`,
                )
                .join(" | ") || "",
          };
        }
        return { ...base, items: "", tax: "", discount: "" };
      });

      const username =
        user?.name?.replace(/\s+/g, "_").toLowerCase() ||
        user?.email?.split("@")[0] ||
        "user";
      const dateStr = `${dayjs(exportRange.start).format("DD-MM-YYYY")}_${dayjs(exportRange.end).format("DD-MM-YYYY")}`;
      downloadCSV(csv, `sesaku-data-${username}-${dateStr}.csv`);
    } catch (err) {
      console.error("Export failed:", err);
      toast.error("Gagal mengunduh data. Coba lagi.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportClick = () => fileInputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const parsedTxs: Transaction[] = [];
        results.data.forEach((row: any) => {
          if (row.name && row.nominal && row.kategori) {
            const rawNominal = row.nominal.toString().replace(/[^0-9]/g, "");
            const parsedNominal = parseInt(rawNominal, 10);

            let rowDate = new Date().toISOString();
            if (row.date) {
              const now = new Date();
              const parts = row.date.split("/");
              if (parts.length === 3) {
                // DD/MM/YYYY
                const d = new Date(
                  parseInt(parts[2]),
                  parseInt(parts[1]) - 1,
                  parseInt(parts[0]),
                  now.getHours(),
                  now.getMinutes(),
                  now.getSeconds(),
                );
                if (!isNaN(d.getTime())) rowDate = d.toISOString();
              } else {
                const d = new Date(row.date);
                if (!isNaN(d.getTime())) {
                  // If parsed date has no time (midnight), inject current time
                  if (d.getHours() === 0 && d.getMinutes() === 0) {
                    d.setHours(
                      now.getHours(),
                      now.getMinutes(),
                      now.getSeconds(),
                    );
                  }
                  rowDate = d.toISOString();
                }
              }
            }

            if (parsedNominal > 0) {
              const parseItems = (raw: string) => {
                if (!raw?.trim()) return undefined;
                return raw.split("|").map((s) => {
                  const lastColon = s.lastIndexOf(":");
                  if (lastColon === -1) return { name: s.trim(), price: 0 };
                  return {
                    name: s.slice(0, lastColon).trim(),
                    price:
                      parseInt(
                        s.slice(lastColon + 1).replace(/[^0-9]/g, ""),
                        10,
                      ) || 0,
                  };
                });
              };
              const parseTaxDisc = (raw: string) => {
                if (!raw?.trim()) return undefined;
                return raw.split("|").map((s) => {
                  const lastColon = s.lastIndexOf(":");
                  const name =
                    lastColon === -1 ? s.trim() : s.slice(0, lastColon).trim();
                  const valStr =
                    lastColon === -1 ? "" : s.slice(lastColon + 1).trim();
                  const isPercent = valStr.includes("%");
                  const value =
                    parseInt(valStr.replace(/[^0-9]/g, ""), 10) || 0;
                  return {
                    name,
                    value,
                    type: isPercent ? ("percent" as const) : ("fixed" as const),
                  };
                });
              };

              const details: any = {};
              const items = parseItems(row.items);
              const tax = parseTaxDisc(row.tax);
              const discount = parseTaxDisc(row.discount);
              if (items) details.items = items;
              if (tax) details.tax = tax;
              if (discount) details.discount = discount;

              parsedTxs.push({
                id: crypto.randomUUID(),
                name: row.name,
                nominal: parsedNominal,
                kategori: row.kategori,
                keterangan: row.keterangan || "",
                date: rowDate,
                source: row.source || "CSV",
                ...(Object.keys(details).length ? { details } : {}),
              } as Transaction);
            }
          }
        });

        if (parsedTxs.length > 0) {
          importData(parsedTxs);
          alert(`Berhasil mengimpor ${parsedTxs.length} transaksi!`);
        } else {
          alert(
            "Format CSV tidak valid atau data kosong. Pastikan kolom name, nominal, dan kategori terisi.",
          );
        }

        if (fileInputRef.current) fileInputRef.current.value = "";
      },
      error: (error: any) => {
        alert(`Error parsing CSV: ${error.message}`);
      },
    });
  };

  const handleOcrClick = () => {
    ocrInputRef.current?.click();
  };

  const compressImage = async (file: File): Promise<File> => {
    let processFile = file;

    // OCR.space supported types
    const supportedTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/bmp",
      "image/tiff",
      "application/pdf",
    ];

    // Skip compression if file is already under 500KB AND is a supported type
    if (
      processFile.size <= 500 * 1024 &&
      supportedTypes.includes(processFile.type.toLowerCase())
    ) {
      return processFile;
    }

    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(processFile);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = async () => {
          let width = img.width;
          let height = img.height;
          let quality = 0.8;
          const MAX_DIMENSION = 1800;

          if (width > height) {
            if (width > MAX_DIMENSION) {
              height = Math.round((height * MAX_DIMENSION) / width);
              width = MAX_DIMENSION;
            }
          } else {
            if (height > MAX_DIMENSION) {
              width = Math.round((width * MAX_DIMENSION) / height);
              height = MAX_DIMENSION;
            }
          }

          const getBlob = (
            w: number,
            h: number,
            q: number,
          ): Promise<Blob | null> => {
            return new Promise((res) => {
              const canvas = document.createElement("canvas");
              canvas.width = w;
              canvas.height = h;
              const ctx = canvas.getContext("2d");
              if (!ctx) return res(null);
              ctx.drawImage(img, 0, 0, w, h);
              // Pertahankan tipe asli, fallback ke jpeg
              canvas.toBlob(
                (blob) => res(blob),
                processFile.type || "image/jpeg",
                q,
              );
            });
          };

          const MAX_FILE_SIZE = 480 * 1024; // 480 KB limit (under 500KB)
          let currentBlob: Blob | null = null;
          let attempts = 0;

          while (attempts < 6) {
            currentBlob = await getBlob(width, height, quality);
            if (currentBlob && currentBlob.size <= MAX_FILE_SIZE) {
              break;
            }
            // Jika masih lebih besar dari batas 500KB, kurangi dimensi dan kualitas
            width = Math.round(width * 0.8);
            height = Math.round(height * 0.8);
            quality = Math.max(0.5, quality - 0.1);
            attempts++;
          }

          if (currentBlob) {
            const compressedFile = new File([currentBlob], processFile.name, {
              type: processFile.type || "image/jpeg",
              lastModified: Date.now(),
            });

            if (
              compressedFile.size > processFile.size &&
              processFile.size <= MAX_FILE_SIZE
            ) {
              resolve(processFile);
            } else {
              resolve(compressedFile);
            }
          } else {
            resolve(processFile);
          }
        };
        img.onerror = () => resolve(processFile);
      };
      reader.onerror = () => resolve(processFile);
    });
  };

  const handleOcrChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsScanning(true);

      const compressedFile = await compressImage(file);

      const res = await scanReceipt(compressedFile);
      const result = res.data;

      if (result.error) {
        alert(`Error OCR: ${result.error || "Gagal memproses struk"}`);
        return;
      }

      setOcrPrefill({
        name:
          result.supplier && result.supplier !== "Unknown"
            ? `Transaksi ${result.supplier}`
            : result?.name || "OCR Transaction",
        nominal:
          result.total_amount > 0
            ? result.total_amount
            : result.totalData?.price || 0,
        kategori: result.purchase_category || "Lainnya",
        keterangan: result?.keterangan || "Hasil Scan Struk",
        date:
          result.date && dayjs(result.date).isValid()
            ? dayjs(result.date).format("YYYY-MM-DD")
            : dayjs().format("YYYY-MM-DD"),
        items:
          result.items?.length > 0
            ? result.items.map((item: any) => ({
                name:
                  item.qty > 1 ? `${item.qty} ${item.name}` : item.name || "",
                price: item.price || 0,
              }))
            : undefined,
      });
      setIsOcrModalOpen(true);
    } catch (error: any) {
      alert(`Error OCR: ${error.message}`);
    } finally {
      setIsScanning(false);
      if (ocrInputRef.current) ocrInputRef.current.value = "";
    }
  };

  const [isCollapsed, setIsCollapsed] = useState(true);

  return (
    <>
      <div
        className="flex flex-col p-4 rounded-xl mt-4"
        style={{ background: "var(--surface)" }}
      >
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="flex items-center justify-between w-full text-left"
        >
          <p
            className="text-[14px] font-semibold"
            style={{ color: "var(--text-display)" }}
          >
            Manajemen Data
          </p>
          <LuChevronDown
            size={16}
            style={{
              transform: isCollapsed ? "rotate(0deg)" : "rotate(180deg)",
              transition: "transform 0.2s",
            }}
          />
        </button>

        {!isCollapsed && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-4 ">
            <button
              onClick={handleDownloadTemplate}
              className="w-full h-11 text-[13px] font-medium rounded-lg"
              style={{
                border: "1px solid var(--border-visible)",
                color: "var(--text-secondary)",
                background: "transparent",
              }}
            >
              Contoh Format CSV
            </button>
            <button
              onClick={() => setExportModalOpen(true)}
              className="w-full h-11 text-[13px] font-medium rounded-lg flex items-center justify-center gap-1.5"
              style={{
                border: "1px solid var(--border-visible)",
                color: "var(--text-secondary)",
                background: "transparent",
              }}
            >
              <LuDownload size={14} />
              Unduh Data
            </button>
            <button
              onClick={handleImportClick}
              className="w-full h-11 text-[13px] font-bold rounded-lg"
              style={{
                background: "var(--accent)",
                color: "white",
                border: "none",
              }}
            >
              Upload CSV
            </button>
            <button
              onClick={handleOcrClick}
              className="w-full h-11 text-[13px] font-bold rounded-lg flex items-center justify-center gap-1.5"
              style={{
                border: "1px solid var(--border-visible)",
                color: "white",
                background: "var(--accent)",
              }}
            >
              <LuScan size={14} />
              Scan Struk
            </button>
          </div>
        )}

        <input
          type="file"
          accept=".csv"
          ref={fileInputRef}
          style={{ display: "none" }}
          onChange={handleFileChange}
        />
        <input
          type="file"
          accept="image/*"
          ref={ocrInputRef}
          style={{ display: "none" }}
          onChange={handleOcrChange}
        />
      </div>

      {/* Floating Action Button for Scan Struk */}
      <button
        onClick={handleOcrClick}
        disabled={isScanning}
        className="fixed bottom-24 right-4 z-50 flex items-center justify-center rounded-full shadow-lg transition-transform hover:scale-105 active:scale-95"
        style={{
          width: "56px",
          height: "56px",
          background: "var(--accent)",
          color: "white",
          border: "none",
          opacity: isScanning ? 0.7 : 1,
        }}
      >
        <LuScan size={24} />
      </button>

      <TransactionFormModal
        open={isOcrModalOpen}
        ocrPrefill={ocrPrefill}
        onClose={() => {
          setIsOcrModalOpen(false);
          setOcrPrefill(null);
        }}
      />

      {isScanning && (
        <div className="fixed inset-0 h-screen z-[9999] flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin mb-4"></div>
          <p className="text-white text-lg font-semibold animate-pulse">
            Memproses Foto...
          </p>
          <p className="text-white/80 text-sm mt-2">
            Mohon tunggu, AI sedang membaca data struk.
          </p>
        </div>
      )}

      {/* ── Export modal ─────────────────────────────────── */}
      {exportModalOpen && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.65)" }}
          onClick={(e) =>
            e.target === e.currentTarget && setExportModalOpen(false)
          }
        >
          <div
            className="w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border-visible)",
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-5 py-4"
              style={{ borderBottom: "1px solid var(--border)" }}
            >
              <div className="flex items-center gap-2">
                <LuDownload size={16} color="var(--accent)" />
                <p
                  className="text-[15px] font-semibold"
                  style={{ color: "var(--text-display)" }}
                >
                  Unduh Data CSV
                </p>
              </div>
              <button
                onClick={() => setExportModalOpen(false)}
                className="w-7 h-7 flex items-center justify-center rounded-full"
                style={{
                  background: "var(--border)",
                  border: "none",
                  color: "var(--text-secondary)",
                  cursor: "pointer",
                }}
              >
                <LuX size={14} />
              </button>
            </div>

            {/* Body */}
            <div className="px-5 py-5 flex flex-col gap-4">
              <div>
                <p
                  className="text-[12px] mb-2 font-medium"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Pilih rentang tanggal data yang ingin diunduh (Maks 1 Tahun)
                </p>
                <DateRangePicker
                  range={exportRange}
                  onChange={setExportRange}
                  placeholder="Pilih tanggal..."
                  maxRangeDays={365}
                />
              </div>

              {exportRange && (
                <div
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-[12px]"
                  style={{
                    background: "rgba(91,155,246,0.1)",
                    color: "var(--accent)",
                  }}
                >
                  <LuDownload size={12} />
                  <span>
                    {dayjs(exportRange.start).format("DD MMM YYYY")} —{" "}
                    {dayjs(exportRange.end).format("DD MMM YYYY")}
                  </span>
                </div>
              )}
            </div>

            {/* Footer */}
            <div
              className="px-5 py-4 flex gap-3"
              style={{ borderTop: "1px solid var(--border)" }}
            >
              <button
                onClick={() => setExportModalOpen(false)}
                className="flex-1 h-11 rounded-xl text-[13px] font-medium"
                style={{
                  border: "1px solid var(--border-visible)",
                  color: "var(--text-secondary)",
                  background: "transparent",
                }}
              >
                Batal
              </button>
              <button
                onClick={handleExport}
                disabled={!exportRange}
                className="flex-1 h-11 rounded-xl text-[13px] font-bold flex items-center justify-center gap-2 disabled:opacity-40"
                style={{
                  background: "var(--accent)",
                  color: "white",
                  border: "none",
                  cursor: exportRange ? "pointer" : "not-allowed",
                }}
              >
                <LuDownload size={14} />
                Unduh Sekarang
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Download loading overlay ──────────────────────── */}
      {isExporting && (
        <div className="fixed inset-0 z-[300] flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm">
          <div
            className="flex flex-col items-center gap-4 px-8 py-8 rounded-2xl"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border-visible)",
              minWidth: 240,
            }}
          >
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ background: "rgba(91,155,246,0.15)" }}
            >
              <LuDownload size={22} color="var(--accent)" />
            </div>
            <div className="text-center">
              <p
                className="text-[15px] font-semibold"
                style={{ color: "var(--text-display)" }}
              >
                Menyiapkan file...
              </p>
              <p
                className="text-[12px] mt-1"
                style={{ color: "var(--text-secondary)" }}
              >
                Sedang mengambil dan menyusun data transaksi
              </p>
            </div>
            <div
              className="w-full h-1 rounded-full overflow-hidden"
              style={{ background: "var(--border)" }}
            >
              <div
                className="h-full rounded-full"
                style={{
                  width: "60%",
                  background: "var(--accent)",
                  animation: "pulse 1.4s ease-in-out infinite",
                }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
