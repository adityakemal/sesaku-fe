
import { useRef, useEffect } from "react";
import { LuSearch, LuX } from "react-icons/lu";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
}

export function SearchInput({
  value,
  onChange,
  placeholder = "Cari...",
  className = "",
  autoFocus = false,
}: SearchInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  return (
    <div className={`relative ${className}`}>
      <LuSearch
        size={14}
        color="var(--text-disabled)"
        className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
      />
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-10 pl-9 pr-3 text-[13px] rounded-lg outline-none"
        style={{
          border: "1px solid var(--border-visible)",
          background: "var(--black)",
          color: "var(--text-primary)",
          boxSizing: "border-box",
          padding: "0 12px 0 36px",
        }}
      />
      {value && (
        <button
          onClick={() => {
            onChange("");
            inputRef.current?.focus();
          }}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full"
          style={{
            background: "none",
            border: "none",
            color: "var(--text-disabled)",
            cursor: "pointer",
          }}
        >
          <LuX size={12} color="currentColor" />
        </button>
      )}
    </div>
  );
}
