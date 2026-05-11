import { LuCircleX } from "react-icons/lu";

interface ErrorModalProps {
  message: string;
  onClose: () => void;
}

export function ErrorModal({ message, onClose }: ErrorModalProps) {
  if (!message) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
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
          className="p-4 flex items-center gap-3"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(215,25,33,0.15)" }}
          >
            <LuCircleX size={18} color="var(--accent)" />
          </div>
          <p
            className="text-[15px] font-semibold"
            style={{ color: "var(--text-display)" }}
          >
            Gagal
          </p>
        </div>

        <div className="p-5 text-center">
          <p className="text-[14px]" style={{ color: "var(--text-secondary)" }}>
            {message}
          </p>
        </div>

        <div
          className="p-4 flex"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          <button
            onClick={onClose}
            className="flex-1 h-10 text-[13px] font-bold rounded-lg"
            style={{
              background: "var(--accent)",
              color: "white",
              border: "none",
            }}
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
