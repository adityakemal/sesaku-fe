import { create } from "zustand";

const STORAGE_KEY = "sesaku_onboarding";

interface OnboardingState {
  /** Whether the user has completed (or skipped) the tour */
  completed: boolean;
  /** Mark the tour as done — persists to localStorage */
  completeTour: () => void;
  /** Reset tour state (e.g. from Settings) */
  resetTour: () => void;
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
  completed: localStorage.getItem(STORAGE_KEY) === "done",

  completeTour: () => {
    localStorage.setItem(STORAGE_KEY, "done");
    set({ completed: true });
  },

  resetTour: () => {
    localStorage.removeItem(STORAGE_KEY);
    set({ completed: false });
  },
}));
