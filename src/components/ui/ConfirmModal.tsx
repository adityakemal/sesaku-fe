export interface ConfirmModalProps {
  open: boolean;
  title: string;
  description: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmModal({
  open,
  title,
  description,
  confirmText = "Ya",
  cancelText = "Batal",
  onConfirm,
  onClose,
}: ConfirmModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.6)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-sm rounded-xl"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border-visible)",
        }}
      >
        <div
          className="p-4"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <p
            className="text-[16px] font-semibold text-center"
            style={{ color: "var(--text-display)" }}
          >
            {title}
          </p>
        </div>

        <div className="p-5 text-center whitespace-pre-wrap">
          <p className="text-[14px]" style={{ color: "var(--text-secondary)" }}>
            {description}
          </p>
        </div>

        <div
          className="p-4 flex gap-3"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          <button
            onClick={onConfirm}
            className="flex-1 h-10 text-[13px] font-bold rounded-lg"
            style={{
              background: "var(--accent)",
              color: "white",
              border: "none",
            }}
          >
            {confirmText}
          </button>
          <button
            onClick={onClose}
            className="flex-1 h-10 text-[13px] font-medium rounded-lg"
            style={{
              border: "1px solid var(--border-visible)",
              color: "var(--text-primary)",
              background: "transparent",
            }}
          >
            {cancelText}
          </button>
        </div>
      </div>
    </div>
  );
}
