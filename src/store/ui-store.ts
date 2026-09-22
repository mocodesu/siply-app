// ─────────────────────────────────────────────────────────────
// store/ui-store.ts
//
// Tiny coordination store for data that has to flow *backwards*
// through navigation — a modal that needs to hand a value back to
// the screen that opened it.
//
// expo-router doesn't have a supported "return value" mechanism,
// and threading a value through navigation params only works in
// the forward direction. A store is the least-fragile option.
//
// Each slot is consumed and cleared by the reader, so a stale
// value from a previous visit never leaks into a future one.
// ─────────────────────────────────────────────────────────────
import { create } from "zustand";

interface UIStore {
  /** Date chosen in the calendar picker, pending consumption by History. */
  pendingHistoryDate: Date | null;
  setPendingHistoryDate: (date: Date | null) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  pendingHistoryDate: null,
  setPendingHistoryDate: (date) => set({ pendingHistoryDate: date }),
}));
