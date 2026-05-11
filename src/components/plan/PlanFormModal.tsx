import { useState, useMemo, useEffect } from "react";
import dayjs from "dayjs";
import toast from "react-hot-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createPlan, updatePlan } from "@/api/planApi";
import { useStorageStore } from "@/store/storage";
import { formatCurrency } from "@/utils";
import { CategorySelect } from "@/components/CategorySelect";
import { DateRangePicker } from "@/components/DatePicker";
import { LuCopy } from "react-icons/lu";
import type { Plan as PlanType, PlanItem } from "@/types";

function formatNumber(value: string | number): string {
  const num = value.toString().replace(/[^0-9]/g, "");
  if (!num) return "";
  return new Intl.NumberFormat("id-ID").format(parseInt(num, 10));
}

interface DraftPlan {
  startDate: string;
  endDate: string;
  items: PlanItem[];
}

interface PlanFormModalProps {
  open: boolean;
  onClose: () => void;
  editData?: PlanType | null;
  allPlans: PlanType[];
  latestEndDate: string | null;
}

export function PlanFormModal({
  open,
  onClose,
  editData,
  allPlans,
  latestEndDate,
}: PlanFormModalProps) {
  const queryClient = useQueryClient();
  const allCategories = useStorageStore((s) => s.listCategory).map(
    (c) => c.name,
  );

  const [draft, setDraft] = useState<DraftPlan>({
    startDate: "",
    endDate: "",
    items: [],
  });

  const lastPlan = useMemo(() => {
    if (allPlans.length === 0) return null;
    const others = editData
      ? allPlans.filter((p) => p.id !== editData.id)
      : allPlans;
    if (others.length === 0) return null;
    return [...others].sort((a, b) => b.end_date.localeCompare(a.end_date))[0];
  }, [allPlans, editData]);

  const handleCopyLastPlan = () => {
    if (!lastPlan) return;
    setDraft((prev) => ({
      ...prev,
      items: lastPlan.items.map((item) => ({ ...item })),
    }));
    toast.success("Berhasil menyalin alokasi plan terakhir");
  };

  useEffect(() => {
    if (!open) return;
    if (editData) {
      setDraft({
        startDate: dayjs(editData.start_date).format("YYYY-MM-DD"),
        endDate: dayjs(editData.end_date).format("YYYY-MM-DD"),
        items: editData.items.map((item) => ({ ...item })),
      });
    } else {
      if (latestEndDate) {
        const nextStart = dayjs(latestEndDate).add(1, "day");
        setDraft({
          startDate: nextStart.format("YYYY-MM-DD"),
          endDate: nextStart.endOf("month").format("YYYY-MM-DD"),
          items: [{ category: "", nominal: 0 }],
        });
      } else {
        setDraft({
          startDate: dayjs().startOf("month").format("YYYY-MM-DD"),
          endDate: dayjs().endOf("month").format("YYYY-MM-DD"),
          items: [{ category: "", nominal: 0 }],
        });
      }
    }
  }, [open, editData, latestEndDate]);

  const totalDraft = useMemo(
    () => draft.items.reduce((s, i) => s + i.nominal, 0),
    [draft.items],
  );

  const updateItem = (
    idx: number,
    field: keyof PlanItem,
    value: string | number,
  ) =>
    setDraft((prev) => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === idx ? { ...item, [field]: value } : item,
      ),
    }));

  const invalidatePlans = () => {
    queryClient.invalidateQueries({ queryKey: ["plans-paginated"] });
    queryClient.invalidateQueries({ queryKey: ["plans"] });
  };

  const saveMutation = useMutation({
    mutationFn: (plan: Partial<PlanType>) => {
      if (editData) {
        return updatePlan(editData.id, plan);
      }
      return createPlan(plan);
    },
    onSuccess: () => {
      invalidatePlans();
      onClose();
      toast.success(
        editData ? "Plan berhasil diperbarui" : "Plan berhasil dibuat",
      );
    },
    onError: () =>
      toast.error(editData ? "Gagal memperbarui plan" : "Gagal menyimpan plan"),
  });

  const handleSave = () => {
    if (!draft.startDate || !draft.endDate) {
      toast.error("Pilih periode plan");
      return;
    }
    if (draft.items.length === 0) {
      toast.error("Tambahkan minimal 1 kategori");
      return;
    }
    if (draft.items.some((i) => !i.category || i.nominal <= 0)) {
      toast.error("Lengkapi semua kategori dan nominal");
      return;
    }

    const newStart = dayjs(draft.startDate);
    const newEnd = dayjs(draft.endDate);

    // Check overlap with other plans, excluding the current plan if editing
    const overlap = allPlans.some((p) => {
      if (editData && p.id === editData.id) return false;
      return (
        newStart.isBefore(dayjs(p.end_date)) &&
        newEnd.isAfter(dayjs(p.start_date))
      );
    });

    if (overlap) {
      toast.error("Periode bertabrakan dengan plan yang sudah ada");
      return;
    }

    saveMutation.mutate({
      start_date: draft.startDate,
      end_date: draft.endDate,
      items: draft.items,
      total_amount: totalDraft,
    });
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.6)" }}
    >
      <div
        className="w-full max-w-md max-h-dvh overflow-y-auto rounded-xl p-4 space-y-4"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border-visible)",
        }}
      >
        <div className="flex items-center justify-between">
          <p
            className="text-[16px] font-semibold"
            style={{ color: "var(--text-display)" }}
          >
            {editData ? "Edit Plan" : "Plan Baru"}
          </p>
          <span
            className="text-[14px] font-bold font-mono"
            style={{ color: "var(--accent)" }}
          >
            {formatCurrency(totalDraft)}
          </span>
        </div>

        {/* Date range */}
        <div className="space-y-1.5">
          <p
            className="text-[11px] font-medium"
            style={{ color: "var(--text-secondary)" }}
          >
            Periode
          </p>
          <div className="flex items-center justify-between">
            <DateRangePicker
              range={{
                start: draft.startDate
                  ? dayjs(draft.startDate).toDate()
                  : dayjs().toDate(),
                end: draft.endDate
                  ? dayjs(draft.endDate).toDate()
                  : dayjs().toDate(),
              }}
              onChange={(r) =>
                setDraft((prev) => ({
                  ...prev,
                  startDate: dayjs(r.start).format("YYYY-MM-DD"),
                  endDate: dayjs(r.end).format("YYYY-MM-DD"),
                }))
              }
              disableFuture={false}
              placeholder="Pilih periode plan"
            />

            {!editData && lastPlan && (
              <button
                onClick={handleCopyLastPlan}
                className="text-[11px] font-medium flex items-center gap-1 hover:opacity-80 transition-opacity"
                style={{
                  color: "var(--warning)",
                }}
              >
                <LuCopy size={12} color="currentColor" />
                Salin Plan Terakhir
              </button>
            )}
          </div>
        </div>

        {/* Category allocation */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p
              className="text-[11px] font-medium"
              style={{ color: "var(--text-secondary)" }}
            >
              Alokasi Kategori
            </p>
          </div>

          {draft.items.map((item, i) => {
            const usedByOthers = draft.items
              .filter((_, j) => j !== i)
              .map((x) => x.category)
              .filter(Boolean);
            return (
              <div key={i} className="flex gap-2 items-center">
                <button
                  onClick={() =>
                    setDraft((prev) => ({
                      ...prev,
                      items: prev.items.filter((_, j) => j !== i),
                    }))
                  }
                  className="w-8 h-10 flex-shrink-0 flex items-center justify-center rounded-lg"
                  style={{
                    background: "var(--black)",
                    border: "1px solid var(--border-visible)",
                    color: "var(--text-disabled)",
                  }}
                >
                  ×
                </button>
                <div className="flex-1 min-w-0">
                  <CategorySelect
                    value={item.category}
                    onChange={(cat) => updateItem(i, "category", cat)}
                    disabledCategories={usedByOthers}
                  />
                </div>
                <div className="flex-1 min-w-0 relative">
                  <span
                    className="absolute left-2 top-1/2 -translate-y-1/2 text-[11px] pointer-events-none"
                    style={{ color: "var(--text-disabled)" }}
                  >
                    Rp
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="0"
                    value={item.nominal ? formatNumber(item.nominal) : ""}
                    onChange={(e) =>
                      updateItem(
                        i,
                        "nominal",
                        parseInt(e.target.value.replace(/[^0-9]/g, ""), 10) ||
                          0,
                      )
                    }
                    className="w-full h-10 pl-7 pr-2 text-[13px] font-bold text-right rounded-lg"
                    style={{
                      border: "1px solid var(--border-visible)",
                      background: "var(--black)",
                      color: "var(--text-primary)",
                    }}
                  />
                </div>
              </div>
            );
          })}

          {draft.items.length === 0 && (
            <p
              className="text-[12px] text-center italic py-2"
              style={{ color: "var(--text-disabled)" }}
            >
              Tekan tombol di bawah untuk menambah kategori
            </p>
          )}

          {draft.items.length < allCategories.length && (
            <button
              onClick={() =>
                setDraft((prev) => ({
                  ...prev,
                  items: [...prev.items, { category: "", nominal: 0 }],
                }))
              }
              className="w-full h-10 text-[13px] font-semibold rounded-lg flex items-center justify-center"
              style={{
                border: "1px dashed var(--border-visible)",
                color: "var(--accent)",
                background: "transparent",
              }}
            >
              + Tambah Alokasi Kategori
            </button>
          )}
        </div>

        <div
          className="flex gap-2 pt-4 border-t"
          style={{ borderColor: "var(--border-visible)" }}
        >
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
            disabled={saveMutation.isPending}
            className="flex-1 h-11 text-[13px] font-bold rounded-lg disabled:opacity-50"
            style={{ background: "var(--accent)", color: "white" }}
          >
            {saveMutation.isPending ? "Menyimpan..." : "Simpan Plan"}
          </button>
        </div>
      </div>
    </div>
  );
}
