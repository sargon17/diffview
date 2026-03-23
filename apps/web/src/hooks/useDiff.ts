import { useEffect, useState } from "react";

import type { DiffMode, DiffRequest, DiffResult, SessionInfo } from "@diffview/shared";
import { fetchData } from "@utils/http";

export function useDiff(mode: DiffMode, session: SessionInfo | null, baseBranch: string) {
  const [diff, setDiff] = useState<DiffResult | null>(null);

  useEffect(() => {
    if (!session) return;

    const controller = new AbortController();

    const load = async () => {
      const request: DiffRequest = { mode };
      if (mode === "branch") {
        if (!baseBranch) return;
        request.base = baseBranch;
        request.head = session.currentBranch;
      }
      const response = await fetchData<DiffResult>("/diff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
        signal: controller.signal,
      });
      if (!response.ok || controller.signal.aborted) return;
      setDiff(response.data);
    };

    load().catch(() => {});

    return () => controller.abort();
  }, [mode, session, baseBranch]);

  return diff;
}
