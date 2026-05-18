import type { TooltipRenderProps } from "react-joyride";

/**
 * Custom Joyride tooltip — styled to match sesaKu's dark design system.
 * Uses CSS vars for full dark/light theme compatibility.
 */
export function OnboardingTooltip({
  backProps,
  closeProps,
  continuous,
  index,
  isLastStep,
  primaryProps,
  skipProps,
  step,
  size,
  tooltipProps,
}: TooltipRenderProps) {
  const progress = ((index + 1) / size) * 100;

  return (
    <div
      {...tooltipProps}
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border-visible)",
        borderRadius: 16,
        padding: 0,
        width: 320,
        maxWidth: "calc(100vw - 32px)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px var(--border)",
        overflow: "hidden",
        animation: "emptyFadeIn 0.25s ease-out",
      }}
    >
      {/* Progress bar — thin accent strip at the top */}
      <div
        style={{
          height: 3,
          background: "var(--border)",
          width: "100%",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${progress}%`,
            background: "var(--accent)",
            borderRadius: "0 2px 2px 0",
            transition: "width 0.4s ease",
          }}
        />
      </div>

      {/* Content area */}
      <div style={{ padding: "20px 20px 16px" }}>
        {/* Step counter + close */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 8,
          }}
        >
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "var(--accent)",
              fontFamily: "var(--font-space-mono)",
              letterSpacing: "0.5px",
            }}
          >
            {index + 1}/{size}
          </span>
          <button
            {...closeProps}
            style={{
              background: "none",
              border: "none",
              color: "var(--text-disabled)",
              fontSize: 18,
              cursor: "pointer",
              padding: "2px 4px",
              lineHeight: 1,
              borderRadius: 4,
            }}
          >
            ×
          </button>
        </div>

        {/* Title */}
        {step.title && (
          <h3
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: "var(--text-display)",
              margin: "0 0 6px",
              lineHeight: 1.3,
              fontFamily: "var(--font-space-grotesk)",
            }}
          >
            {step.title}
          </h3>
        )}

        {/* Body */}
        <div
          style={{
            fontSize: 13,
            color: "var(--text-secondary)",
            lineHeight: 1.6,
            margin: 0,
          }}
        >
          {step.content}
        </div>
      </div>

      {/* Footer — actions */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "12px 20px",
          borderTop: "1px solid var(--border)",
          gap: 8,
        }}
      >
        {/* Skip */}
        {!isLastStep && (
          <button
            {...skipProps}
            style={{
              background: "none",
              border: "none",
              color: "var(--text-disabled)",
              fontSize: 12,
              cursor: "pointer",
              padding: "6px 0",
              fontFamily: "inherit",
            }}
          >
            Lewati
          </button>
        )}
        {isLastStep && <span />}

        <div style={{ display: "flex", gap: 8 }}>
          {/* Back */}
          {index > 0 && (
            <button
              {...backProps}
              style={{
                height: 34,
                padding: "0 14px",
                fontSize: 12,
                fontWeight: 600,
                borderRadius: 8,
                border: "1px solid var(--border-visible)",
                background: "transparent",
                color: "var(--text-primary)",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Kembali
            </button>
          )}

          {/* Next / Finish */}
          {continuous && (
            <button
              {...primaryProps}
              style={{
                height: 34,
                padding: "0 18px",
                fontSize: 12,
                fontWeight: 700,
                borderRadius: 8,
                border: "none",
                background: "var(--accent)",
                color: "#fff",
                cursor: "pointer",
                fontFamily: "inherit",
                boxShadow: "0 2px 8px rgba(215,25,33,0.3)",
              }}
            >
              {isLastStep ? "Mulai Sekarang! 🚀" : "Lanjut →"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
