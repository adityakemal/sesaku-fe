/**
 * PlanCard — displays a single budget plan with:
 * - Status-tinted background for past plans (visible without expanding)
 * - Merged plan vs. actual rows (no redundancy) for past plans
 * - Conclusion summary with status badge
 * - Delete action for non-past plans only
 */
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getTransactions } from "@/api/transactionApi";
import { LuChevronDown } from "react-icons/lu";
import dayjs from "dayjs";
import { formatCurrency } from "@/utils";
import type { Plan as PlanType, PlanItem, Transaction } from "@/types";

// ── Types ────────────────────────────────────────────────────────────────────

export type PlanPhase = "active" | "past" | "upcoming";

export interface StatusTier {
  label: string;
  color: string;
  bg: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

export function getPlanPhase(plan: PlanType): PlanPhase {
  const today = dayjs().startOf("day");
  if (dayjs(plan.end_date).isBefore(today, "day")) return "past";
  if (dayjs(plan.start_date).isAfter(today, "day")) return "upcoming";
  return "active";
}

export function getStatusTier(pct: number): StatusTier {
  if (pct <= 70)
    return {
      label: "GREAT SAVE",
      color: "#22c55e",
      bg: "rgba(34,197,94,0.08)",
    };
  if (pct <= 95)
    return {
      label: "ON TRACK",
      color: "var(--success)",
      bg: "rgba(74,158,92,0.08)",
    };
  if (pct <= 102)
    return {
      label: "SPOT ON",
      color: "rgba(91,155,246,0.9)",
      bg: "rgba(91,155,246,0.08)",
    };
  if (pct <= 120)
    return {
      label: "EXCEEDED",
      color: "var(--warning)",
      bg: "rgba(212,168,67,0.08)",
    };
  return {
    label: "OVER BUDGET",
    color: "var(--accent)",
    bg: "rgba(215,25,33,0.08)",
  };
}

function catBarColor(pct: number): string {
  if (pct <= 95) return "var(--success)";
  if (pct <= 105) return "rgba(91,155,246,0.9)";
  if (pct <= 120) return "var(--warning)";
  return "var(--accent)";
}

/** Compute total spent + remaining for a plan period using backend provided spent value */
export function usePlanActuals(plan: PlanType) {
  return useMemo(() => {
    const spent = plan.spent || 0;
    const remaining = plan.total_amount - spent;
    const pct = plan.total_amount > 0 ? (spent / plan.total_amount) * 100 : 0;
    return { spent, remaining, pct };
  }, [plan]);
}

// ── Sub-components ───────────────────────────────────────────────────────────

/** Row for past plan: category + planned + actual + mini bar */
function MergedCategoryRow({ item }: { item: PlanItem }) {
  const actual = item.actual || 0;

  const pct = item.nominal > 0 ? (actual / item.nominal) * 100 : 0;
  const barColor = catBarColor(pct);
  const isOver = actual > item.nominal;

  return (
    <div
      className="px-4 py-2.5 space-y-1.5"
      style={{ borderBottom: "1px solid var(--border)" }}
    >
      <div className="flex items-center justify-between">
        <span
          className="text-[12px] font-medium"
          style={{ color: "var(--text-primary)" }}
        >
          {item.category}
        </span>
        <div className="flex items-center gap-1.5">
          <span
            className="text-[12px] font-mono font-semibold"
            style={{ color: isOver ? "var(--accent)" : "var(--text-primary)" }}
          >
            {formatCurrency(actual)}
          </span>
          <span
            className="text-[11px]"
            style={{ color: "var(--text-disabled)" }}
          >
            / {formatCurrency(item.nominal)}
          </span>
          <span
            className="text-[10px] font-bold w-9 text-right"
            style={{ color: barColor }}
          >
            {Math.min(pct, 999).toFixed(0)}%
          </span>
        </div>
      </div>
      <div
        className="h-1 rounded-full overflow-hidden"
        style={{ background: "var(--border)" }}
      >
        <div
          className="h-full rounded-full"
          style={{
            width: `${Math.min(pct, 100)}%`,
            background: barColor,
            transition: "width 0.4s ease",
          }}
        />
      </div>
    </div>
  );
}

/** Conclusion footer for past plans */
function PlanConclusion({
  spent,
  total,
  remaining,
  pct,
}: {
  spent: number;
  total: number;
  remaining: number;
  pct: number;
}) {
  const status = getStatusTier(pct);
  return (
    <div
      className="mx-4 mb-4 mt-2 rounded-lg px-3 py-2.5 flex items-center justify-between"
      style={{ background: status.bg }}
    >
      <div>
        <p
          className="text-[10px] font-medium mb-0.5"
          style={{ color: "var(--text-disabled)" }}
        >
          Hasil Akhir
        </p>
        <p
          className="text-[13px] font-mono"
          style={{ color: "var(--text-secondary)" }}
        >
          {formatCurrency(spent)}{" "}
          <span style={{ color: "var(--text-disabled)" }}>
            / {formatCurrency(total)}
          </span>
        </p>
      </div>
      <div className="text-right">
        <span
          className="text-[11px] font-black uppercase tracking-widest"
          style={{ color: status.color }}
        >
          {status.label}
        </span>
        <p className="text-[11px] mt-0.5" style={{ color: status.color }}>
          {remaining >= 0
            ? `+${formatCurrency(remaining)}`
            : `-${formatCurrency(Math.abs(remaining))}`}
        </p>
      </div>
    </div>
  );
}

/** Simple row for active / upcoming plans */
function PlannedCategoryRow({ item }: { item: PlanItem }) {
  return (
    <div
      className="flex items-center justify-between px-4 py-2.5"
      style={{ borderBottom: "1px solid var(--border)" }}
    >
      <span className="text-[13px]" style={{ color: "var(--text-primary)" }}>
        {item.category}
      </span>
      <span
        className="text-[13px] font-mono font-semibold"
        style={{ color: "var(--text-primary)" }}
      >
        {formatCurrency(item.nominal)}
      </span>
    </div>
  );
}

// ── PlanCard (exported) ──────────────────────────────────────────────────────

interface PlanCardProps {
  plan: PlanType;
  onDelete: (plan: PlanType) => void;
  onEdit: (plan: PlanType) => void;
  isDeleting: boolean;
}

export function PlanCard({
  plan,
  onDelete,
  onEdit,
  isDeleting,
}: PlanCardProps) {
  const [expanded, setExpanded] = useState(false);

  const phase = getPlanPhase(plan);
  const isActive = phase === "active";
  const isPast = phase === "past";

  const { spent, remaining, pct } = usePlanActuals(plan);
  const status = isPast ? getStatusTier(pct) : null;

  // Card border: accent for active, default for others
  const cardBorder = isActive
    ? "2px solid var(--accent)"
    : "1px solid var(--border)";
  // Card background: subtle status tint for past, default for others
  const cardBg = isPast && status ? status.bg : "var(--surface)";

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ background: cardBg, border: cardBorder }}
    >
      {/* ── Collapsed header ── */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p
              className="text-[12px]"
              style={{ color: "var(--text-secondary)" }}
            >
              {dayjs(plan.start_date).format("DD MMM YYYY")} –{" "}
              {dayjs(plan.end_date).format("DD MMM YYYY")}
            </p>

            {/* Phase / status badge */}
            {isActive && (
              <span
                className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                style={{ background: "var(--accent)", color: "white" }}
              >
                Berjalan
              </span>
            )}
            {phase === "upcoming" && (
              <span
                className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
                style={{
                  border: "1px solid var(--border-visible)",
                  color: "var(--text-secondary)",
                }}
              >
                Mendatang
              </span>
            )}
            {isPast && status && (
              <span
                className="text-[10px] font-black uppercase tracking-wide px-1.5 py-0.5 rounded"
                style={{ color: status.color }}
              >
                {status.label}
              </span>
            )}
          </div>

          <p
            className="text-[15px] font-bold font-mono"
            style={{ color: "var(--accent)" }}
          >
            {formatCurrency(plan.total_amount)}
          </p>
        </div>

        <LuChevronDown
          size={16}
          color="var(--text-secondary)"
          style={{
            flexShrink: 0,
            transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s",
          }}
        />
      </button>

      {/* ── Expanded content ── */}
      {expanded && (
        <div style={{ borderTop: "1px solid var(--border)" }}>
          {isPast
            ? /* Merged plan vs actual rows for past plans */
              (plan.items || []).map((item) => (
                <MergedCategoryRow key={item.category} item={item} />
              ))
            : /* Simple planned rows for active / upcoming */
              (plan.items || []).map((item) => (
                <PlannedCategoryRow key={item.category} item={item} />
              ))}

          {/* Conclusion for past plans */}
          {isPast && (
            <PlanConclusion
              spent={spent}
              total={plan.total_amount}
              remaining={remaining}
              pct={pct}
            />
          )}

          {/* Actions — only for non-past plans */}
          {!isPast && (
            <div
              className="px-4 py-3 flex items-center justify-between gap-3"
              style={{ borderTop: "1px solid var(--border)" }}
            >
              <button
                onClick={() => onDelete(plan)}
                disabled={isDeleting}
                className="text-[12px] font-semibold disabled:opacity-50"
                style={{ color: "var(--accent)" }}
              >
                Hapus Plan
              </button>
              <button
                onClick={() => onEdit(plan)}
                disabled={isDeleting}
                className="text-[12px] font-semibold disabled:opacity-50"
                style={{ color: "var(--text-secondary)" }}
              >
                Edit Plan
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
