import { useState, useCallback } from "react";
import { Joyride, ACTIONS, EVENTS, STATUS } from "react-joyride";
import type { Step, EventData, Controls } from "react-joyride";
import { useOnboardingStore } from "@/store/onboarding";
import { OnboardingTooltip } from "./OnboardingTooltip";

/**
 * Tour steps for the Dashboard (Home) page.
 * Each target matches a `data-tour="xxx"` attribute in the DOM.
 *
 * v3 API: `skipBeacon` replaces `disableBeacon`,
 *         `overlayClickAction` replaces `disableOverlayClose`,
 *         `buttons` controls which tooltip buttons appear.
 */
const TOUR_STEPS: Step[] = [
  {
    target: "body",
    placement: "center",
    skipBeacon: true,
    content: (
      <div>
        <p>
          Selamat datang di <strong>sesaKu</strong>! 🎉
        </p>
        <p
          style={{ marginTop: 8, fontSize: 12, color: "var(--text-disabled)" }}
        >
          Kami akan memandumu mengenal fitur-fitur utama agar kamu bisa langsung
          mulai mencatat keuangan.
        </p>
      </div>
    ),
    title: "Hai, Selamat Datang!",
  },
  {
    target: '[data-tour="section-plan"]',
    placement: "bottom",
    skipBeacon: true,
    title: "📋 Realita vs Plan",
    content:
      "Di sini kamu bisa melihat perbandingan pengeluaran nyata dengan rencana anggaranmu. Buat plan pertamamu untuk mulai tracking!",
  },
  {
    target: '[data-tour="section-income"]',
    placement: "bottom",
    skipBeacon: true,
    title: "💰 Sisa Saldo",
    content:
      "Pantau sisa saldo keuanganmu di sini. Catat income untuk melihat progress pengeluaran vs pemasukan secara real-time.",
  },
  {
    target: '[data-tour="section-monthly"]',
    placement: "top",
    skipBeacon: true,
    title: "📊 Statistik Bulanan",
    content:
      "Lihat ringkasan, tren, dan breakdown pengeluaranmu per bulan. Gunakan navigator untuk berpindah bulan.",
  },
  {
    target: '[data-tour="nav-transaction"]',
    placement: "top",
    skipBeacon: true,
    title: "🧾 Catat Transaksi",
    content:
      "Ini halaman utama untuk mencatat pengeluaranmu. Bisa manual atau scan struk dengan AI!",
  },
  {
    target: '[data-tour="nav-income"]',
    placement: "top",
    skipBeacon: true,
    title: "💵 Kelola Income",
    content:
      "Tambahkan dan kelola semua pemasukan di sini — gaji, freelance, bonus, semuanya tercatat rapi.",
  },
  {
    target: '[data-tour="nav-plan"]',
    placement: "top",
    skipBeacon: true,
    title: "📌 Buat Plan",
    content:
      "Buat rencana anggaran per kategori. Bandingkan rencana dengan kenyataan di Dashboard.",
  },
  {
    target: '[data-tour="nav-settings"]',
    placement: "top",
    skipBeacon: true,
    title: "⚙️ Pengaturan",
    content:
      "Atur kategori, undang anggota keluarga, dan kelola workspace-mu di sini.",
  },
];

interface OnboardingTourProps {
  /** Only render the tour on the dashboard */
  enabled?: boolean;
}

export function OnboardingTour({ enabled = true }: OnboardingTourProps) {
  const { completed, completeTour } = useOnboardingStore();
  const [stepIndex, setStepIndex] = useState(0);
  const [run, setRun] = useState(() => !completed && enabled);

  const handleEvent = useCallback(
    (data: EventData, _controls: Controls) => {
      const { action, index, status, type } = data;

      // Advance or go back
      if ([EVENTS.STEP_AFTER, EVENTS.TARGET_NOT_FOUND].includes(type as any)) {
        setStepIndex(index + (action === ACTIONS.PREV ? -1 : 1));
      }

      // Tour finished or skipped
      if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status as any)) {
        setRun(false);
        completeTour();
      }
    },
    [completeTour],
  );

  // Don't render at all if completed and not manually re-triggered
  if (completed && !run) return null;
  if (!enabled) return null;

  return (
    <Joyride
      steps={TOUR_STEPS}
      run={run}
      stepIndex={stepIndex}
      continuous
      scrollToFirstStep
      onEvent={handleEvent}
      tooltipComponent={OnboardingTooltip}
      locale={{
        back: "Kembali",
        close: "Tutup",
        last: "Mulai Sekarang!",
        next: "Lanjut",
        skip: "Lewati",
      }}
      options={{
        overlayColor: "rgba(0, 0, 0, 0.75)",
        overlayClickAction: false,
        buttons: ["skip", "back", "primary", "close"],
        zIndex: 10000,
        spotlightRadius: 12,
      }}
      // styles={{
      //   options: {
      //     arrowColor: "var(--surface)",
      //   },
      // }}
    />
  );
}
