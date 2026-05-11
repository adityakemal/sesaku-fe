
import type { ReactNode } from 'react';
import { DateRangePicker, type DateRange } from '../DatePicker';

interface AppHeaderProps {
  title: string;
  isShowDatepicker?: boolean;
  dateRange?: DateRange;
  onRangeChange?: (range: DateRange) => void;
  /** Max selectable date range in days for the date picker (e.g. 90). Default: unlimited. */
  maxRangeDays?: number;
  /** Slot for any custom content rendered on the right side of the header */
  rightSlot?: ReactNode;
}

export function AppHeader({
  title,
  isShowDatepicker = true,
  dateRange,
  onRangeChange,
  maxRangeDays,
  rightSlot,
}: AppHeaderProps) {
  return (
    <header
      className="flex justify-between items-center sticky top-0 z-30 -mx-4 px-4 py-3"
      style={{
        background: "var(--black)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <h1
        className="font-display text-2xl md:text-4xl font-bold"
        style={{ color: 'var(--text-display)' }}
      >
        {title}
      </h1>
      <div className="flex items-center gap-2">
        {isShowDatepicker && dateRange && onRangeChange && (
          <DateRangePicker range={dateRange} onChange={onRangeChange} maxRangeDays={maxRangeDays} />
        )}
        {rightSlot}
      </div>
    </header>
  );
}
