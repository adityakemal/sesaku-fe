import { useState, useRef, useEffect, useMemo } from "react";
import { useStorageStore } from "@/store/storage";
import { createCategory, getCategories } from "@/api/categoryApi";
import { ErrorModal } from "@/components/ErrorModal";

interface CategorySelectProps {
  value: string;
  onChange: (category: string) => void;
  disabledCategories?: string[];
}

export function CategorySelect({ value, onChange, disabledCategories = [] }: CategorySelectProps) {
  const listCategory = useStorageStore((s) => s.listCategory);
  const setListCat = useStorageStore((s) => s.setListCategory);
  const categories = useMemo(
    () => listCategory.map((c) => c.name),
    [listCategory],
  );

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [modalError, setModalError] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (categories.length > 0 && !categories.includes(value)) {
      // Pick the first category that is not already taken by another row
      const firstAvailable = categories.find((c) => !disabledCategories.includes(c));
      if (firstAvailable) onChange(firstAvailable);
    }
  }, [categories, value, onChange, disabledCategories]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelectCategory = (cat: string) => {
    onChange(cat);
    setDropdownOpen(false);
  };

  const handleAddCategory = async () => {
    const trimmed = newCategory.trim();
    if (!trimmed) return;
    if (
      listCategory.some((c) => c.name.toLowerCase() === trimmed.toLowerCase())
    ) {
      return;
    }
    try {
      await createCategory(trimmed);
      const res = await getCategories();
      setListCat(res.data);
    } catch (err: any) {
      setModalError(err.response?.data?.message || "Gagal menambah kategori");
      return;
    }
    onChange(trimmed);
    setNewCategory("");
    setDropdownOpen(false);
  };

  return (
    <>
      <div className="w-full relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="w-full h-10 px-3 text-[14px] cursor-pointer rounded-lg flex items-center justify-between gap-2"
          style={{
            border: "1px solid var(--border-visible)",
            background: "var(--black)",
            color: "var(--text-primary)",
          }}
        >
          <span className="truncate">{value}</span>
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            style={{
              flexShrink: 0,
              transform: dropdownOpen ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.2s",
            }}
          >
            <path
              d="M2 4L6 8L10 4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        {dropdownOpen && (
          <div
            className="absolute z-50 w-full mt-1 rounded-lg overflow-hidden"
            style={{
              border: "1px solid var(--border-visible)",
              background: "var(--black)",
              boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
            }}
          >
            <div style={{ maxHeight: "200px", overflowY: "auto" }}>
              {categories.map((k) => {
                const isDisabled = disabledCategories.includes(k) && k !== value;
                return (
                  <button
                    key={k}
                    type="button"
                    onClick={() => !isDisabled && handleSelectCategory(k)}
                    className="w-full px-3 py-2.5 text-[13px] text-left flex items-center gap-2"
                    style={{
                      background: value === k ? "var(--surface)" : "transparent",
                      color: isDisabled
                        ? "var(--text-disabled)"
                        : value === k
                          ? "var(--accent)"
                          : "var(--text-primary)",
                      borderBottom: "1px solid var(--border)",
                      fontWeight: value === k ? 600 : 400,
                      cursor: isDisabled ? "not-allowed" : "pointer",
                    }}
                  >
                    {value === k && (
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ flexShrink: 0 }}>
                        <path d="M1 5.5L3.5 8L9 2" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                    <span className="truncate">{k}</span>
                    {isDisabled && (
                      <span className="ml-auto text-[10px]" style={{ color: "var(--text-disabled)" }}>pakai</span>
                    )}
                  </button>
                );
              })}
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
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddCategory()}
                className="flex-1 h-8 px-2.5 text-[12px] rounded-md"
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
                onClick={handleAddCategory}
                className="h-8 px-2.5 text-[11px] font-mono font-bold rounded-md"
                style={{
                  background: newCategory.trim()
                    ? "var(--accent)"
                    : "var(--border)",
                  color: newCategory.trim() ? "white" : "var(--text-secondary)",
                  border: "none",
                  cursor: newCategory.trim() ? "pointer" : "default",
                  whiteSpace: "nowrap",
                }}
              >
                + Add
              </button>
            </div>
          </div>
        )}
      </div>
      <ErrorModal message={modalError} onClose={() => setModalError("")} />
    </>
  );
}
