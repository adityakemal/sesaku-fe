import { useState, useRef, useEffect } from "react";
import dayjs from "dayjs";

interface MonthPickerProps {
  selectedDate: Date;
  onChange: (date: Date) => void;
}

export function MonthPicker({ selectedDate, onChange }: MonthPickerProps) {
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(dayjs(selectedDate).year());
  const containerRef = useRef<HTMLDivElement>(null);

  const today = dayjs();
  const selectedMonth = dayjs(selectedDate);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const months = [
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

  const handleSelectMonth = (monthIndex: number) => {
    const selected = dayjs().year(viewYear).month(monthIndex).startOf("month");
    onChange(selected.toDate());
    setOpen(false);
  };

  const handleThisMonth = () => {
    onChange(dayjs().startOf("month").toDate());
    setViewYear(dayjs().year());
    setOpen(false);
  };

  const displayText = selectedMonth.format("MMM YYYY");

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => {
          setOpen(!open);
          setViewYear(selectedMonth.year());
        }}
        className="h-10 px-3 text-[13px] rounded-lg flex items-center gap-2"
        style={{
          border: "1px solid var(--border-visible)",
          color: "var(--text-primary)",
          background: "var(--surface)",
        }}
      >
        <span>{displayText}</span>
        <svg
          width="10"
          height="10"
          viewBox="0 0 10 10"
          fill="none"
          style={{
            transform: open ? "rotate(180deg)" : "rotate(0)",
            transition: "transform 0.2s",
          }}
        >
          <path
            d="M1.5 3.5L5 7L8.5 3.5"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && (
        <div
          className="absolute right-0 z-50 mt-2 w-64 rounded-xl overflow-hidden"
          style={{
            border: "1px solid var(--border-visible)",
            background: "var(--surface)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
          }}
        >
          {/* Year navigation */}
          <div
            className="flex items-center justify-between px-3 py-2.5"
            style={{ borderBottom: "1px solid var(--border)" }}
          >
            <button
              onClick={() => setViewYear(viewYear - 1)}
              className="w-7 h-7 flex items-center justify-center rounded text-[16px]"
              style={{
                color: "var(--text-secondary)",
                background: "none",
                border: "none",
                cursor: "pointer",
              }}
            >
              ‹
            </button>
            <span
              className="text-[14px] font-semibold"
              style={{ color: "var(--text-display)" }}
            >
              {viewYear}
            </span>
            <button
              onClick={() =>
                viewYear < today.year() && setViewYear(viewYear + 1)
              }
              className="w-7 h-7 flex items-center justify-center rounded text-[16px]"
              style={{
                color:
                  viewYear >= today.year()
                    ? "var(--text-disabled)"
                    : "var(--text-secondary)",
                background: "none",
                border: "none",
                cursor: viewYear >= today.year() ? "not-allowed" : "pointer",
              }}
            >
              ›
            </button>
          </div>

          {/* Month grid */}
          <div className="grid grid-cols-3 gap-1 p-2.5">
            {months.map((m, i) => {
              const isFuture =
                viewYear > today.year() ||
                (viewYear === today.year() && i > today.month());
              const isSelected =
                viewYear === selectedMonth.year() &&
                i === selectedMonth.month();
              const isCurrent =
                viewYear === today.year() && i === today.month();

              return (
                <button
                  key={m}
                  onClick={() => !isFuture && handleSelectMonth(i)}
                  disabled={isFuture}
                  className="h-9 rounded-lg text-[13px] transition-colors"
                  style={{
                    background: isSelected ? "var(--accent)" : "transparent",
                    color: isSelected
                      ? "white"
                      : isFuture
                        ? "var(--text-disabled)"
                        : isCurrent
                          ? "var(--accent)"
                          : "var(--text-primary)",
                    border:
                      isCurrent && !isSelected
                        ? "1px solid var(--accent)"
                        : "1px solid transparent",
                    cursor: isFuture ? "not-allowed" : "pointer",
                    fontWeight: isSelected || isCurrent ? 600 : 400,
                  }}
                >
                  {m}
                </button>
              );
            })}
          </div>

          {/* Quick buttons */}
          <div className="flex items-center gap-1.5 px-2.5 pb-2.5">
            <button
              onClick={() => setOpen(false)}
              className="h-8 px-3 text-[11px] font-mono rounded-lg"
              style={{
                border: "1px solid var(--border-visible)",
                color: "var(--text-secondary)",
                background: "transparent",
                cursor: "pointer",
              }}
            >
              Tutup
            </button>
            <button
              onClick={handleThisMonth}
              className="flex-1 h-8 text-[11px] font-mono font-medium rounded-lg"
              style={{
                background: "var(--accent)",
                color: "white",
                border: "none",
                cursor: "pointer",
              }}
            >
              Bulan Ini
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

interface DayPickerProps {
  date: string; // YYYY-MM-DD
  onChange: (date: string) => void;
  className?: string;
  style?: React.CSSProperties;
}

export function DayPicker({
  date,
  onChange,
  className,
  style,
}: DayPickerProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewDate, setViewDate] = useState(dayjs(date));
  const [dropUp, setDropUp] = useState(false);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  useEffect(() => {
    if (open) {
      setViewDate(dayjs(date));
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        setDropUp(spaceBelow < 340);
      }
    }
  }, [open, date]);

  const selectedDay = dayjs(date);
  const startOfMonth = viewDate.startOf("month");
  const daysInMonth = viewDate.daysInMonth();
  const startDay = startOfMonth.day(); // 0 is Sunday

  const days = [];
  for (let i = 0; i < startDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.preventDefault();
    setViewDate(viewDate.subtract(1, "month"));
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.preventDefault();
    setViewDate(viewDate.add(1, "month"));
  };

  const handleSelectDay = (day: number) => {
    const newDate = viewDate.date(day).format("YYYY-MM-DD");
    onChange(newDate);
    setOpen(false);
  };

  return (
    <div
      ref={containerRef}
      className={`relative ${className || ""}`}
      style={style}
    >
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full h-full px-3 flex items-center justify-between gap-2 rounded-lg cursor-pointer"
        style={{
          border: "1px solid var(--border-visible)",
          color: "var(--text-primary)",
          background: "var(--black)",
        }}
      >
        <span className="truncate text-[13px]">
          {selectedDay.format("DD MMM YYYY")}
        </span>
        <svg
          width="10"
          height="10"
          viewBox="0 0 10 10"
          fill="none"
          style={{
            flexShrink: 0,
            transform: open ? "rotate(180deg)" : "rotate(0)",
            transition: "transform 0.2s",
          }}
        >
          <path
            d="M1.5 3.5L5 7L8.5 3.5"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && (
        <div
          className="absolute z-50 w-[260px] rounded-xl overflow-hidden"
          style={{
            border: "1px solid var(--border-visible)",
            background: "var(--black)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
            ...(dropUp
              ? { bottom: "calc(100% + 4px)", top: "auto" }
              : { top: "calc(100% + 4px)", bottom: "auto" }),
          }}
        >
          <div
            className="flex items-center justify-between px-3 py-2"
            style={{ borderBottom: "1px solid var(--border)" }}
          >
            <button
              onClick={handlePrevMonth}
              className="w-7 h-7 flex items-center justify-center rounded text-[16px] hover:bg-white/5 transition-colors"
              style={{
                color: "var(--text-secondary)",
                background: "none",
                border: "none",
                cursor: "pointer",
              }}
            >
              ‹
            </button>
            <span
              className="text-[13px] font-semibold"
              style={{ color: "var(--text-display)" }}
            >
              {viewDate.format("MMMM YYYY")}
            </span>
            <button
              onClick={handleNextMonth}
              className="w-7 h-7 flex items-center justify-center rounded text-[16px] hover:bg-white/5 transition-colors"
              style={{
                color: "var(--text-secondary)",
                background: "none",
                border: "none",
                cursor: "pointer",
              }}
            >
              ›
            </button>
          </div>

          <div className="p-2">
            <div className="grid grid-cols-7 gap-1 mb-1">
              {["M", "S", "S", "R", "K", "J", "S"].map((d, i) => (
                <div
                  key={i}
                  className="text-center text-[10px] font-bold"
                  style={{ color: "var(--text-disabled)" }}
                >
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {days.map((d, i) => {
                if (d === null) return <div key={i} />;
                const isSelected = selectedDay.isSame(viewDate.date(d), "day");
                const isToday = dayjs().isSame(viewDate.date(d), "day");

                return (
                  <button
                    key={i}
                    onClick={() => handleSelectDay(d)}
                    className="h-8 rounded flex items-center justify-center text-[12px] transition-colors"
                    style={{
                      background: isSelected ? "var(--accent)" : "transparent",
                      color: isSelected
                        ? "white"
                        : isToday
                          ? "var(--accent)"
                          : "var(--text-primary)",
                      border:
                        isToday && !isSelected
                          ? "1px solid var(--accent)"
                          : "none",
                      fontWeight: isSelected || isToday ? 600 : 400,
                      cursor: "pointer",
                    }}
                  >
                    {d}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 pb-2.5">
            <button
              onClick={() => setOpen(false)}
              className="h-8 px-3 text-[11px] font-mono rounded-lg"
              style={{
                border: "1px solid var(--border-visible)",
                color: "var(--text-secondary)",
                background: "transparent",
                cursor: "pointer",
              }}
            >
              Tutup
            </button>
            <button
              onClick={() => {
                setViewDate(dayjs());
                onChange(dayjs().format("YYYY-MM-DD"));
                setOpen(false);
              }}
              className="flex-1 h-8 text-[11px] font-mono font-medium rounded-lg"
              style={{
                background: "var(--accent)",
                color: "white",
                border: "none",
                cursor: "pointer",
              }}
            >
              Hari Ini
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export interface DateRange {
  start: Date;
  end: Date;
}

const DAY_LABELS = ["M", "S", "S", "R", "K", "J", "S"];

export function DateRangePicker({
  range,
  onChange,
  placeholder,
  onClear,
  disableFuture = true,
  minDate,
}: {
  range: DateRange | null;
  onChange: (range: DateRange) => void;
  placeholder?: string;
  onClear?: () => void;
  disableFuture?: boolean;
  minDate?: Date;
}) {
  const [open, setOpen] = useState(false);
  const effectiveStart = range ? range.start : new Date();
  const [viewMonth1, setViewMonth1] = useState(() =>
    dayjs(effectiveStart).startOf("month"),
  );
  const [viewMonth2, setViewMonth2] = useState(() =>
    dayjs(effectiveStart).startOf("month").add(1, "month"),
  );
  const [selecting, setSelecting] = useState<"start" | "end">("start");
  const [pendingStart, setPendingStart] = useState<dayjs.Dayjs | null>(null);

  const today = dayjs().startOf("day");
  const startDay = range ? dayjs(range.start) : today;
  const endDay = range ? dayjs(range.end) : today;

  useEffect(() => {
    if (open) {
      const s = range ? dayjs(range.start) : today;
      setViewMonth1(s.startOf("month"));
      setViewMonth2(s.startOf("month").add(1, "month"));
      setPendingStart(null);
      setSelecting("start");
    }
  }, [open, range]);

  const handlePrevTwoMonths = () => {
    setViewMonth1(viewMonth1.subtract(2, "month"));
    setViewMonth2(viewMonth2.subtract(2, "month"));
  };

  const handleNextTwoMonths = () => {
    const next = viewMonth1.add(2, "month");
    if (!disableFuture || !next.startOf("month").isAfter(today, "month")) {
      setViewMonth1(next);
      setViewMonth2(viewMonth2.add(2, "month"));
    }
  };

  const handleDayClick = (date: dayjs.Dayjs) => {
    if (disableFuture && date.isAfter(today, "day")) return;
    if (minDate && date.isBefore(minDate, "day")) return;
    if (selecting === "start") {
      setPendingStart(date);
      setSelecting("end");
    } else if (pendingStart) {
      const s = pendingStart.isBefore(date) ? pendingStart : date;
      const e = pendingStart.isBefore(date) ? date : pendingStart;
      onChange({
        start: s.startOf("day").toDate(),
        end: e.endOf("day").toDate(),
      });
      setOpen(false);
      setSelecting("start");
      setPendingStart(null);
    }
  };

  const isInRange = (date: dayjs.Dayjs) => {
    if (selecting === "start" || !pendingStart) {
      return (
        date.isSame(startDay, "day") ||
        date.isSame(endDay, "day") ||
        (date.isAfter(startDay, "day") && date.isBefore(endDay, "day"))
      );
    }
    const s = pendingStart.isBefore(date) ? pendingStart : date;
    const e = pendingStart.isBefore(date) ? date : pendingStart;
    return (
      date.isSame(s, "day") ||
      date.isSame(e, "day") ||
      (date.isAfter(s, "day") && date.isBefore(e, "day"))
    );
  };

  const isRangeEdge = (date: dayjs.Dayjs) => {
    if (selecting === "start" || !pendingStart) {
      return date.isSame(startDay, "day") || date.isSame(endDay, "day");
    }
    return date.isSame(pendingStart, "day");
  };

  const handleThisMonth = () => {
    const first = today.startOf("month");
    const last = disableFuture ? today : today.endOf("month").startOf("day");
    onChange({ start: first.toDate(), end: last.toDate() });
    setOpen(false);
    setSelecting("start");
    setPendingStart(null);
  };

  const displayText = !range
    ? placeholder || "Pilih tanggal"
    : startDay.isSame(endDay, "day")
      ? startDay.format("DD MMM YYYY")
      : startDay.isSame(endDay, "year")
        ? `${startDay.format("DD MMM")} — ${endDay.format("DD MMM YYYY")}`
        : `${startDay.format("DD MMM YYYY")} — ${endDay.format("DD MMM YYYY")}`;

  const renderMonth = (viewDate: dayjs.Dayjs) => {
    const startOfMonth = viewDate.startOf("month");
    const daysInMonth = viewDate.daysInMonth();
    const startDow = startOfMonth.day();
    const days: (number | null)[] = [];
    for (let i = 0; i < startDow; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);

    return (
      <div className="flex-1">
        <div
          className="text-[13px] font-semibold text-center mb-1.5"
          style={{ color: "var(--text-display)" }}
        >
          {viewDate.format("MMMM YYYY")}
        </div>
        <div className="grid grid-cols-7 gap-1 mb-1">
          {DAY_LABELS.map((d, i) => (
            <div
              key={i}
              className="text-center text-[11px] font-bold"
              style={{ color: "var(--text-disabled)" }}
            >
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days.map((d, i) => {
            if (d === null) return <div key={i} />;
            const date = viewDate.date(d);
            const isFuture = disableFuture && date.isAfter(today, "day");
            const isPast = !!minDate && date.isBefore(minDate, "day");
            const isDisabled = isFuture || isPast;
            const isToday = date.isSame(today, "day");
            const inRange = isInRange(date);
            const isEdge = isRangeEdge(date);

            return (
              <button
                key={i}
                onClick={() => handleDayClick(date)}
                disabled={isDisabled}
                className="h-9 rounded flex items-center justify-center text-[13px] transition-colors"
                style={{
                  background: isEdge
                    ? "var(--accent)"
                    : inRange
                      ? "rgba(91,155,246,0.15)"
                      : "transparent",
                  color: isEdge
                    ? "white"
                    : isDisabled
                      ? "var(--text-disabled)"
                      : isToday
                        ? "var(--accent)"
                        : "var(--text-primary)",
                  border:
                    isToday && !isEdge
                      ? "1px solid var(--accent)"
                      : "1px solid transparent",
                  fontWeight: isEdge || isToday ? 600 : 400,
                  cursor: isDisabled ? "not-allowed" : "pointer",
                }}
              >
                {d}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="h-10 px-3 text-[13px] rounded-lg flex items-center gap-2 whitespace-nowrap"
        style={{
          border: "1px solid var(--border-visible)",
          color: "var(--text-primary)",
          background: "var(--surface)",
        }}
      >
        <span className="truncate max-w-[150px] text-[13px]">
          {displayText}
        </span>
        {onClear && range ? (
          <span
            onClick={(e) => {
              e.stopPropagation();
              onClear();
            }}
            className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-white/10 flex-shrink-0"
            style={{ color: "var(--text-disabled)", cursor: "pointer" }}
          >
            ×
          </span>
        ) : (
          <svg
            width="10"
            height="10"
            viewBox="0 0 10 10"
            fill="none"
            style={{ flexShrink: 0 }}
          >
            <path
              d="M1.5 3.5L5 7L8.5 3.5"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-1150  flex justify-center items-center h-dvh p-4 "
          style={{ background: "rgba(0,0,0,0.6)" }}
          // onClick={(e) => {
          //   if (e.target === e.currentTarget) {
          //     setOpen(false);
          //     setSelecting("start");
          //     setPendingStart(null);
          //   }
          // }}
        >
          <div
            className="w-full max-w-[98%] md:max-w-md max-h-[80vh]  z-150 overflow-y-auto rounded-xl mb-16"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border-visible)",
            }}
          >
            <div
              className="flex items-center justify-between px-4 py-3 sticky top-0 z-10"
              style={{
                borderBottom: "1px solid var(--border)",
                background: "var(--surface)",
              }}
            >
              <button
                onClick={handlePrevTwoMonths}
                className="w-8 h-8 flex items-center justify-center rounded text-[18px] hover:bg-white/5 transition-colors"
                style={{
                  color: "var(--text-secondary)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                ‹
              </button>
              <span
                className="text-[14px] font-semibold"
                style={{ color: "var(--text-display)" }}
              >
                {viewMonth1.format("MMM YYYY")} —{" "}
                {viewMonth2.format("MMM YYYY")}
              </span>
              <button
                onClick={handleNextTwoMonths}
                className="w-8 h-8 flex items-center justify-center rounded text-[18px] hover:bg-white/5 transition-colors"
                style={{
                  color: "var(--text-secondary)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                ›
              </button>
            </div>

            <div className="p-4 flex flex-col gap-4">
              {renderMonth(viewMonth1)}
              {renderMonth(viewMonth2)}
            </div>

            <div className="flex items-center gap-2 px-4 pb-4">
              <button
                onClick={() => {
                  setOpen(false);
                  setSelecting("start");
                  setPendingStart(null);
                }}
                className="h-10 px-4 text-[13px] font-medium rounded-lg"
                style={{
                  border: "1px solid var(--border-visible)",
                  color: "var(--text-secondary)",
                  background: "transparent",
                  cursor: "pointer",
                }}
              >
                Tutup
              </button>
              <button
                onClick={handleThisMonth}
                className="flex-1 h-10 text-[13px] font-bold rounded-lg"
                style={{
                  background: "var(--accent)",
                  color: "white",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Bulan Ini
              </button>
            </div>

            {selecting === "end" && (
              <div className="px-4 pb-3">
                <p
                  className="text-[12px] text-center"
                  style={{ color: "var(--text-disabled)" }}
                >
                  Pilih tanggal akhir
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
