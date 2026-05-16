/**
 * Full-page loading indicator — shown while async data / session is loading.
 * Uses the app's CSS variable tokens so it always matches the active theme.
 */
export function LoadingPage() {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
        background: "var(--bg)",
      }}
    >
      {/* Spinner ring */}
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: "50%",
          border: "3px solid var(--border-visible)",
          borderTopColor: "var(--accent)",
          animation: "lp-spin 0.75s linear infinite",
        }}
      />

      {/* Subtle label */}
      <p
        style={{
          fontSize: 12,
          color: "var(--text-disabled)",
          letterSpacing: "0.04em",
        }}
      >
        Memuat...
      </p>

      {/* Keyframes injected once */}
      <style>{`
        @keyframes lp-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
