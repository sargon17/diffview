import { Virtualizer } from "@pierre/diffs/react";

import Header from "./components/Header";
import Patch from "./components/Patch";
import DiffTreeSidebar from "./components/DiffTreeSidebar";
import { useDiffMode } from "./hooks/useDiffMode";
import { useDiff } from "./hooks/useDiff";
import { useRefs } from "./hooks/useRefs";
import { useSession } from "./hooks/useSession";
import { useCookieState } from "./hooks/useCookieState";

function App() {
  const { current: diffMode } = useDiffMode();
  const session = useSession();
  const refs = useRefs();
  const baseBranchCookieKey = session ? `base-branch:${session.repo.name}` : "";
  const [baseBranch, setBaseBranch] = useCookieState(baseBranchCookieKey, session?.defaultBaseRef ?? "", {
    enabled: !!baseBranchCookieKey,
  });
  const diff = useDiff(diffMode, session, baseBranch);

  const repoBranches = refs?.branches
    .map((branch) => branch.name)
    .filter((branch) => !branch.includes("->")) ?? [];

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
