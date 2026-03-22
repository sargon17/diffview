import type { DiffMode } from "@diffview/shared";
import { create } from "zustand";

interface DiffModeStore {
  current: DiffMode;
  update: (v: DiffMode) => void;
}

export const useDiffModeStore = create<DiffModeStore>()((set) => ({
  current: "working",
  update: (v) => set(() => ({ current: v })),
}));
