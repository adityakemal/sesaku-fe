import { useEffect, useState } from "react";
import { getWorkspaces } from "@/api/memberApi";

export default function WorkspaceModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [spaces, setSpaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      getWorkspaces()
        .then((res) => {
          const fetchedSpaces = res.data;
          setSpaces(fetchedSpaces);
          
          // If only 1 space, auto select it and close
          if (fetchedSpaces.length === 1) {
            handleSelect(fetchedSpaces[0].id);
          } else {
            setLoading(false);
          }
        })
        .catch(() => setLoading(false));
    }
  }, [isOpen]);

  const handleSelect = (id: string) => {
    localStorage.setItem("sesaku_workspace_id", id);
    // Reload the page so the app re-initializes with the new header
    window.location.href = "/";
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div
        className="w-full max-w-sm rounded-2xl p-6 shadow-2xl relative"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border-visible)",
        }}
      >
        {loading ? (
          <div className="text-center py-8">
            <p className="text-[14px]" style={{ color: "var(--text-disabled)" }}>
              Menyiapkan workspace...
            </p>
          </div>
        ) : (
          <>
            <h2
              className="text-2xl font-bold mb-2 font-display text-center"
              style={{ color: "var(--text-primary)" }}
            >
              Pilih Workspace
            </h2>
            <p
              className="text-[13px] text-center mb-6"
              style={{ color: "var(--text-secondary)" }}
            >
              Kamu diundang ke budget space lain. Pilih space yang ingin kamu akses:
            </p>
            <div className="space-y-3">
              {spaces.map((space) => (
                <button
                  key={space.id}
                  onClick={() => handleSelect(space.id)}
                  className="w-full flex items-center justify-between p-4 rounded-xl transition-all hover:opacity-80"
                  style={{
                    background: "var(--black)",
                    border: "1px solid var(--border-visible)",
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg"
                      style={{
                        background: space.isOwner ? "var(--accent)" : "var(--surface-raised)",
                        color: space.isOwner ? "white" : "var(--text-primary)",
                      }}
                    >
                      {space.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="text-left">
                      <p
                        className="font-bold text-[14px]"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {space.name}
                      </p>
                      <p
                        className="text-[12px]"
                        style={{ color: "var(--text-disabled)" }}
                      >
                        {space.isOwner ? "Space Pribadi" : "Member"}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
            {/* Optional close button if they want to cancel, but we force them to pick */}
          </>
        )}
      </div>
    </div>
  );
}
