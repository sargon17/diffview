import { useEffect, useState } from "react";

import type { DiffRequest, DiffResult, RefsResponse, SessionInfo } from "@diffview/shared";
import { Virtualizer } from "@pierre/diffs/react";

import Header from "./components/Header";
import Patch from "./components/Patch";
import DiffTreeSidebar from "./components/DiffTreeSidebar";
import { fetchData } from "@utils/http";
import { useDiffModeStore } from "./store/diff-mode.store";
import { useCookieState } from "./hooks/useCookieState";

function App() {
  const { current: diffMode } = useDiffModeStore();
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [refs, setRefs] = useState<RefsResponse | null>(null);
  const [diff, setDiff] = useState<DiffResult | null>(null);

  const baseBranchCookieKey = session ? `base-branch:${session.repo.name}` : "";
  const [baseBranch, setBaseBranch] = useCookieState(baseBranchCookieKey, session?.defaultBaseRef ?? "", {
    enabled: !!baseBranchCookieKey,
  });

  useEffect(() => {
    const loadSession = async () => {
      const response = await fetchData<SessionInfo>("/session");
      if (!response.ok) return;
      setSession(response.data);
    };
    loadSession();
  }, []);

  useEffect(() => {
    const loadRefs = async () => {
      const response = await fetchData<RefsResponse>("/refs");
      if (!response.ok) return;
      setRefs(response.data);
    };
    loadRefs();
  }, []);

  useEffect(() => {
    if (!session) return;
    const loadDiff = async () => {
      const request: DiffRequest = { mode: diffMode };
      if (diffMode === "branch") {
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
    loadDiff();
  }, [diffMode, session, baseBranch]);

  const repoBranches = refs?.branches.map((branch) => branch.name) ?? [];

  return (
    <div className="flex h-dvh min-h-screen flex-col bg-background text-foreground">
      <Header branches={repoBranches} baseBranch={baseBranch} onBaseBranchChange={setBaseBranch} />
      <div className="grid min-h-0 flex-1 grid-cols-[280px_minmax(0,1fr)] overflow-hidden">
        <DiffTreeSidebar
          files={diff?.files ?? []}
          isLoading={diff === null}
          onSelectFile={(file) => {
            const el = document.getElementById(`diff-file-${CSS.escape(file.path)}`);
            el?.scrollIntoView({ behavior: "smooth", block: "start" });
          }}
        />

        <main className="min-h-0 overflow-hidden">
          <Virtualizer className="h-full min-h-0 overflow-y-auto p-3">
            {diff?.files.map((file) =>
              file.patch ? <Patch key={file.path} patch={file.patch} file={file.path} /> : null,
            )}
          </Virtualizer>
        </main>
      </div>
    </div>
  );
}

export default App;
