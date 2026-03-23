import { DIFF_MODES, type DiffMode } from "@diffview/shared";

import { useCookieState } from "./useCookieState";

const DIFF_MODE_COOKIE = "diff-mode";

function isDiffMode(value: string | null): value is DiffMode {
  return value !== null && DIFF_MODES.includes(value as DiffMode);
}

export function useDiffMode() {
  const [stored, setStored] = useCookieState(DIFF_MODE_COOKIE, "working");

  const current = isDiffMode(stored) ? stored : "working";

  const update = (value: DiffMode) => setStored(value);

  return { current, update } as const;
}
