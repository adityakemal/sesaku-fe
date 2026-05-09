import { useState, useRef, useEffect } from "react";
import dayjs from "dayjs";

interface MonthNavigatorProps {
  value: dayjs.Dayjs;
  onChange: (month: dayjs.Dayjs) => void;
  disableFuture?: boolean;
}

const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agu",
  "Sep",
  "Okt",
  "Nov",
  "Des",
];

/**
 * MonthNavigator — compact inline month header with:
 * - ‹ › chevrons to step prev/next month
 * - Click on the month label to open a year-grid modal picker
 * - Current month highlighted with accent dot
 *
 * UI: ‹  May 2026  ›
 */
export function MonthNavigator({
  value,
  onChange,
  disableFuture = false,
}: MonthNavigatorProps) {
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(value.year());
  const panelRef = useRef<HTMLDivElement>(null);
  const today = dayjs();
  const isCurrentMonth = value.isSame(today, "month");

  const isNextDisabled =
    disableFuture &&
    (value.year() > today.year() ||
      (value.year() === today.year() && value.month() >= today.month()));
  const isNextYearDisabled = disableFuture && viewYear >= today.year();

  // Sync viewYear when value changes externally
  useEffect(() => {
    setViewYear(value.year());
  }, [value]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handlePrev = () => onChange(value.subtract(1, "month"));
  const handleNext = () => onChange(value.add(1, "month"));

  const handlePickMonth = (monthIdx: number) => {
    onChange(dayjs().year(viewYear).month(monthIdx).startOf("month"));
    setOpen(false);
  };

  const handleGoToday = () => {
    onChange(today.startOf("month"));
    setViewYear(today.year());
    setOpen(false);
  };

  return (
    <div
      className="relative flex items-center justify-center gap-1"
      ref={panelRef}
    >
      {/* Prev chevron */}
      <button
        onClick={handlePrev}
        aria-label="Bulan sebelumnya"
        className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors hover:bg-white/10"
        style={{
          background: "transparent",
          border: "none",
          color: "var(--text-secondary)",
          cursor: "pointer",
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path
            d="M15 18L9 12L15 6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {/* Month label — click to open picker */}
      <button
        onClick={() => {
          setOpen((o) => !o);
          setViewYear(value.year());
        }}
        className="flex items-center gap-1.5 px-2 py-1 rounded-lg transition-colors hover:bg-white/10"
        style={{ background: "transparent", border: "none", cursor: "pointer" }}
      >
        <span
          className="text-[14px] font-semibold"
          style={{ color: "var(--text-display)" }}
        >
          {value.format("MMM YYYY")}
        </span>
        {/* dot indicator for current month */}
        {isCurrentMonth && (
          <span
            className="flex-shrink-0 border px-1 text-[9px] border-0 text-white rounded-full"
            style={{ background: "var(--accent)" }}
          >
            Now
          </span>
        )}
        {/* <svg
          width="10" height="10" viewBox="0 0 10 10" fill="none"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }}
        >
          <path d="M1.5 3.5L5 7L8.5 3.5" stroke="var(--text-secondary)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg> */}
      </button>

      {/* Next chevron */}
      <button
        onClick={handleNext}
        disabled={isNextDisabled}
        aria-label="Bulan berikutnya"
        className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors hover:bg-white/10"
        style={{
          background: "transparent",
          border: "none",
          color: "var(--text-secondary)",
          cursor: isNextDisabled ? "not-allowed" : "pointer",
          opacity: isNextDisabled ? 0.3 : 1,
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path
            d="M9 18L15 12L9 6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {/* Month picker panel */}
      {open && (
        <div
          className="absolute top-full mt-2 left-1/2 -translate-x-1/2 z-50 w-72 rounded-xl overflow-hidden"
          style={{
            border: "1px solid var(--border-visible)",
            background: "var(--surface)",
            boxShadow: "0 12px 40px rgba(0,0,0,0.45)",
          }}
        >
          {/* Year navigator inside panel */}
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{ borderBottom: "1px solid var(--border)" }}
          >
            <button
              onClick={() => setViewYear((y) => y - 1)}
              className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors hover:bg-white/10"
              style={{
                background: "none",
                border: "none",
                color: "var(--text-secondary)",
                cursor: "pointer",
              }}
            >
              ‹
            </button>
            <span
              className="text-[13px] font-semibold"
              style={{ color: "var(--text-display)" }}
            >
              {viewYear}
            </span>
            <button
              onClick={() => setViewYear((y) => y + 1)}
              disabled={isNextYearDisabled}
              className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors hover:bg-white/10"
              style={{
                background: "none",
                border: "none",
                color: "var(--text-secondary)",
                cursor: isNextYearDisabled ? "not-allowed" : "pointer",
                opacity: isNextYearDisabled ? 0.3 : 1,
              }}
            >
              ›
            </button>
          </div>

          {/* Month grid */}
          <div className="grid grid-cols-4 gap-1 p-3">
            {MONTH_LABELS.map((label, idx) => {
              const isSelected =
                value.month() === idx && value.year() === viewYear;
              const isNow = today.month() === idx && today.year() === viewYear;
              const isMonthDisabled =
                disableFuture &&
                (viewYear > today.year() ||
                  (viewYear === today.year() && idx > today.month()));

              return (
                <button
                  key={label}
                  onClick={() => handlePickMonth(idx)}
                  disabled={isMonthDisabled}
                  className="h-9 text-[12px] font-medium rounded-lg transition-all relative"
                  style={{
                    background: isSelected
                      ? "var(--accent)"
                      : isNow
                        ? "rgba(215,25,33,0.12)"
                        : "transparent",
                    color: isSelected
                      ? "white"
                      : isNow
                        ? "var(--accent)"
                        : "var(--text-primary)",
                    border: isSelected
                      ? "1px solid var(--accent)"
                      : isNow
                        ? "1px solid var(--accent)"
                        : "1px solid transparent",
                    cursor: isMonthDisabled ? "not-allowed" : "pointer",
                    opacity: isMonthDisabled ? 0.3 : 1,
                    fontWeight: isNow || isSelected ? 700 : 500,
                  }}
                >
                  {label}
                  {isNow && !isSelected && (
                    <span
                      className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                      style={{ background: "var(--accent)" }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Go to current month shortcut */}
          {!isCurrentMonth && (
            <div className="px-3 pb-3">
              <button
                onClick={handleGoToday}
                className="w-full h-8 text-[12px] font-semibold rounded-lg transition-colors"
                style={{
                  border: "1px dashed var(--accent)",
                  color: "var(--accent)",
                  background: "transparent",
                  cursor: "pointer",
                }}
              >
                Ke Bulan Ini
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
