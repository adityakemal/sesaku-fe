import type { ReactNode } from "react";
import { DateRangePicker, type DateRange } from "../DatePicker";

interface AppHeaderProps {
  title: string;
  isShowDatepicker?: boolean;
  dateRange?: DateRange;
  onRangeChange?: (range: DateRange) => void;
  /** Max selectable date range in days for the date picker (e.g. 90). Default: unlimited. */
  maxRangeDays?: number;
  /** Slot for any custom content rendered on the right side of the header */
  rightSlot?: ReactNode;
  showLogo?: boolean;
}

export function AppHeader({
  title,
  isShowDatepicker = true,
  showLogo = false,
  dateRange,
  onRangeChange,
  maxRangeDays,
  rightSlot,
}: AppHeaderProps) {
  return (
    <header
      className="flex justify-between items-center sticky top-0 z-30 -mx-4 px-4 h-[57px]"
      style={{
        background: "var(--black)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <div className="flex items-center gap-2 sm:gap-2">
        {showLogo && (
          <img
            className="h-6 sm:h-10 object-contain rotate-180"
            src="img/logo.png"
            alt="logo"
          />
        )}
        <h1
          className="font-display text-2xl md:text-4xl font-black"
          style={{ color: "var(--text-display)" }}
        >
          {title}
        </h1>
      </div>
      <div className="flex items-center gap-2">
        {isShowDatepicker && dateRange && onRangeChange && (
          <DateRangePicker
            range={dateRange}
            onChange={onRangeChange}
            maxRangeDays={maxRangeDays}
          />
        )}
        {rightSlot}
      </div>
    </header>
  );
}
