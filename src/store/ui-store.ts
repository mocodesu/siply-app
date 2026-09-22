// store/ui-store.ts
//
// Cross-screen UI coordination state.
//
// The selected History day lives here rather than in History's
// component state, so the header, date navigator, log list, and
// total card can each subscribe to it independently. Selecting a
// date re-renders only the sections that actually display it.
import { create } from "zustand";

// -------------------------------------------------------------
// Types
// -------------------------------------------------------------

interface UIStore {
  /** Selected History day, stored as a start-of-day timestamp. */
  selectedHistoryDayMs: number;
  setSelectedHistoryDayMs: (ms: number) => void;
}

// -------------------------------------------------------------
// Helpers
// -------------------------------------------------------------

/** Start-of-day timestamp for the local timezone. */
export function startOfTodayMs(): number {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** Start-of-day timestamp for an arbitrary date. */
export function startOfDayMs(date: Date): number {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

// -------------------------------------------------------------
// Store
// -------------------------------------------------------------

export const useUIStore = create<UIStore>((set) => ({
  selectedHistoryDayMs: startOfTodayMs(),
  setSelectedHistoryDayMs: (ms) => set({ selectedHistoryDayMs: ms }),
}));

// -------------------------------------------------------------
// Atomic selectors
// -------------------------------------------------------------

export const selectSelectedHistoryDayMs = (s: UIStore): number =>
  s.selectedHistoryDayMs;
