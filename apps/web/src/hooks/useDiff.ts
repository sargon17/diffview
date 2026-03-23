import { useEffect, useState } from "react";

import type { DiffRequest, DiffResult, DiffMode, SessionInfo } from "@diffview/shared";
import { fetchData } from "@utils/http";

export function useDiff(mode: DiffMode, session: SessionInfo | null, baseBranch: string) {
  const [diff, setDiff] = useState<DiffResult | null>(null);

  useEffect(() => {
    if (!session) return;
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
      });
      if (!response.ok) return;
      setDiff(response.data);
    };
    load();
  }, [mode, session, baseBranch]);

  return diff;
}
