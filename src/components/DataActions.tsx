import { useRef, useState } from "react";
import Papa from "papaparse";
import dayjs from "dayjs";
import { useBudgetStore } from "@/store/budget";
import { useStorageStore } from "@/store/storage";
import type { Transaction } from "@/types";
import type { DateRange } from "@/components/DatePicker";
import { TransactionFormModal } from "./transactions/TransactionFormModal";
import { scanReceipt } from "@/api/ocrApi";

interface DataActionsProps {
  dateRange?: DateRange;
}

export function DataActions({ dateRange }: DataActionsProps) {
  const { transactions, importData } = useBudgetStore();
  const user = useStorageStore((s) => s.user);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const ocrInputRef = useRef<HTMLInputElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [ocrPrefill, setOcrPrefill] = useState<any>(null);
  const [isOcrModalOpen, setIsOcrModalOpen] = useState(false);

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

  const handleExport = () => {
    let data = transactions;
    if (dateRange) {
      const start = dayjs(dateRange.start).startOf("day").toDate();
      const end = dayjs(dateRange.end).endOf("day").toDate();
      data = transactions.filter((t) => {
        const d = new Date(t.date);
        return d >= start && d <= end;
      });
    }

    const csv = data.map((t) => {
      const base = {
        name: t.name,
        nominal: t.nominal,
        kategori: t.kategori,
        keterangan: t.keterangan || "",
        date: t.date,
        source: t.source || "Web",
      };
      if (t.details?.items?.length) {
        return {
          ...base,
          items: t.details.items
            .map((i) => `${i.name}: ${i.price}`)
            .join(" | "),
          tax:
            t.details.tax
              ?.map(
                (tx) =>
                  `${tx.name}: ${tx.type === "percent" ? tx.value + "%" : tx.value}`,
              )
              .join(" | ") || "",
          discount:
            t.details.discount
              ?.map(
                (d) =>
                  `${d.name}: ${d.type === "percent" ? d.value + "%" : d.value}`,
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
    const startStr = dateRange
      ? dayjs(dateRange.start).format("DD-MM-YYYY")
      : "";
    const endStr = dateRange ? dayjs(dateRange.end).format("DD-MM-YYYY") : "";
    const dateStr = dateRange ? `${startStr}_${endStr}` : "all";
    const filename = `sesaku-data-${username}-${dateStr}.csv`;

    downloadCSV(csv, filename);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

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
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
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
              canvas.toBlob((blob) => res(blob), "image/webp", q);
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
            const newFileName = file.name.replace(/\.[^/.]+$/, "") + ".webp";
            const compressedFile = new File([currentBlob], newFileName, {
              type: "image/webp",
              lastModified: Date.now(),
            });

            if (compressedFile.size > file.size && file.size <= MAX_FILE_SIZE) {
              resolve(file);
            } else {
              resolve(compressedFile);
            }
          } else {
            resolve(file);
          }
        };
        img.onerror = () => resolve(file);
      };
      reader.onerror = () => resolve(file);
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
            : result.totalData?.name || "OCR Transaction",
        nominal:
          result.total_amount > 0
            ? result.total_amount
            : result.totalData?.price || 0,
        kategori: result.purchase_category || "Lainnya",
        keterangan: "Hasil Scan Struk",
        date:
          result.date && dayjs(result.date).isValid()
            ? dayjs(result.date).format("YYYY-MM-DD")
            : dayjs().format("YYYY-MM-DD"),
        items:
          result.items?.length > 0
            ? result.items.map((item: any) => ({
                name: item.name || "",
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
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            style={{
              transform: isCollapsed ? "rotate(0deg)" : "rotate(180deg)",
              transition: "transform 0.2s",
            }}
          >
            <path
              d="M6 9L12 15L18 9"
              stroke="var(--text-secondary)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
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
              Contoh Format
            </button>
            <button
              onClick={handleExport}
              className="w-full h-11 text-[13px] font-medium rounded-lg"
              style={{
                border: "1px solid var(--border-visible)",
                color: "var(--text-secondary)",
                background: "transparent",
              }}
            >
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
              className="w-full h-11 text-[13px] font-bold rounded-lg"
              style={{
                border: "1px solid var(--border-visible)",
                color: "white",
                background: "var(--accent)",
              }}
            >
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
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path
            d="M4 8V6C4 5.46957 4.21071 4.96086 4.58579 4.58579C4.96086 4.21071 5.46957 4 6 4H8"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M4 16V18C4 18.5304 4.21071 19.0391 4.58579 19.4142C4.96086 19.7893 5.46957 20 6 20H8"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M16 4H18C18.5304 4 19.0391 4.21071 19.4142 4.58579C19.7893 4.96086 20 5.46957 20 6V8"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M16 20H18C18.5304 20 19.0391 19.7893 19.4142 19.4142C19.7893 19.0391 20 18.5304 20 18V16"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
          <path
            d="M12 10L14 8"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
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
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin mb-4"></div>
          <p className="text-white text-lg font-semibold animate-pulse">
            Memproses Foto...
          </p>
          <p className="text-white/80 text-sm mt-2">
            Mohon tunggu, AI sedang membaca data struk.
          </p>
        </div>
      )}
    </>
  );
}
