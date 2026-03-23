import type { DiffMode } from "@diffview/shared";
import { create } from "zustand";

import { getCookie, setCookie } from "src/hooks/useCookieState";

const DIFF_MODE_COOKIE = "diff-mode";

interface DiffModeStore {
  current: DiffMode;
  update: (v: DiffMode) => void;
}

export const useDiffModeStore = create<DiffModeStore>()((set) => ({
  current: (getCookie(DIFF_MODE_COOKIE) as DiffMode | null) ?? "working",
  update: (v) => {
    setCookie(DIFF_MODE_COOKIE, v, 60 * 60 * 24 * 30);
    set(() => ({ current: v }));
  },
}));
