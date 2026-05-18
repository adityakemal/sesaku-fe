import type { ReactNode } from "react";

interface EmptyStateProps {
  /** Lucide icon component */
  icon: ReactNode;
  /** Main heading */
  title: string;
  /** Supporting description */
  description: string;
  /** CTA button label */
  actionLabel?: string;
  /** CTA click handler */
  onAction?: () => void;
  /** Optional secondary/muted hint below the CTA */
  hint?: string;
}

/**
 * Shared premium empty-state placeholder used across all pages.
 * Matches the design language of the Plan page's "Belum ada plan" state
 * with an elevated, animated treatment.
 */
export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  hint,
}: EmptyStateProps) {
  return (
    <div
      className="flex flex-col items-center justify-center py-16 px-6 gap-1 text-center"
      style={{ animation: "emptyFadeIn 0.5s ease-out" }}
    >
      {/* Icon container with subtle glow ring */}
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-3"
        style={{
          background:
            "linear-gradient(135deg, rgba(215,25,33,0.08) 0%, rgba(91,155,246,0.06) 100%)",
          border: "1px solid var(--border)",
          boxShadow: "0 0 24px rgba(215,25,33,0.06)",
        }}
      >
        {icon}
      </div>

      {/* Title */}
      <p
        className="text-[15px] font-semibold"
        style={{ color: "var(--text-display)" }}
      >
        {title}
      </p>

      {/* Description */}
      <p
        className="text-[12px] leading-relaxed max-w-[260px]"
        style={{ color: "var(--text-disabled)" }}
      >
        {description}
      </p>

      {/* CTA button */}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-4 h-10 px-6 text-[13px] font-bold rounded-xl transition-all active:scale-95"
          style={{
            background: "var(--accent)",
            color: "white",
            border: "none",
            cursor: "pointer",
            boxShadow: "0 2px 12px rgba(215,25,33,0.25)",
          }}
        >
          {actionLabel}
        </button>
      )}

      {/* Optional hint */}
      {hint && (
        <p
          className="text-[11px] mt-2"
          style={{ color: "var(--text-disabled)", opacity: 0.7 }}
        >
          {hint}
        </p>
      )}
    </div>
  );
}
