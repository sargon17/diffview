import { DIFF_MODES, type DiffMode } from "@diffview/shared";
import { create } from "zustand";

import { getCookie, setCookie } from "src/hooks/useCookieState";

const DIFF_MODE_COOKIE = "diff-mode";

interface DiffModeStore {
  current: DiffMode;
  update: (v: DiffMode) => void;
}

function isDiffMode(value: string | null): value is DiffMode {
  return value !== null && DIFF_MODES.includes(value as DiffMode);
}

const storedDiffMode = getCookie(DIFF_MODE_COOKIE);

export const useDiffModeStore = create<DiffModeStore>()((set) => ({
  current: isDiffMode(storedDiffMode) ? storedDiffMode : "working",
  update: (v) => {
    setCookie(DIFF_MODE_COOKIE, v, 60 * 60 * 24 * 30);
    set(() => ({ current: v }));
  },
}));
