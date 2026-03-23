import { useEffect, useState } from "react";

import type { DiffRequest, DiffResult, SessionInfo } from "@diffview/shared";
import { Virtualizer } from "@pierre/diffs/react";

import Header from "./components/Header";
import Patch from "./components/Patch";
import { fetchData } from "@utils/http";
import { useDiffModeStore } from "./store/diff-mode.store";
import DiffTreeSidebar from "./components/DiffTreeSidebar";

function App() {
  const { current: diffMode } = useDiffModeStore();
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [diff, setDiff] = useState<DiffResult | null>(null);
  const [baseBranch, setBaseBranch] = useState("");

  useEffect(() => {
    const loadSession = async () => {
      const response = await fetchData<SessionInfo>("/session");
      if (!response.ok) return;
      setSession(response.data);
      setBaseBranch(response.data.defaultBaseRef);
    };
    loadSession();
  }, []);

  useEffect(() => {
    const loadDiff = async () => {
      const request: DiffRequest = { mode: diffMode };
      if (diffMode === "branch") {
        if (!session) return;
        request.base = baseBranch || session.defaultBaseRef;
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


  return (
    <div className="flex h-dvh min-h-screen flex-col bg-background text-foreground">
      <Header />
      <div className="grid min-h-0 flex-1 grid-cols-[280px_minmax(0,1fr)] overflow-hidden">
        <DiffTreeSidebar
          files={diff?.files ?? []}
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
