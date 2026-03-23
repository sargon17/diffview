import { Virtualizer } from "@pierre/diffs/react";

import Header from "./components/Header";
import Patch from "./components/Patch";
import DiffTreeSidebar from "./components/DiffTreeSidebar";
import { DiffPageProvider, useDiffPage } from "./providers/DiffPageProvider";

function AppShell() {
  const { diffMode, setDiffMode, baseBranch, setBaseBranch, repoBranches, diff } = useDiffPage();

  return (
    <div className="flex h-dvh min-h-screen flex-col bg-background text-foreground">
      <Header
        diffMode={diffMode}
        onDiffModeChange={setDiffMode}
        branches={repoBranches}
        baseBranch={baseBranch}
        onBaseBranchChange={setBaseBranch}
      />
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
            {diff?.files.map((file: { path: string; patch?: string }) =>
              file.patch ? <Patch key={file.path} patch={file.patch} file={file.path} /> : null,
            )}
          </Virtualizer>
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <DiffPageProvider>
      <AppShell />
    </DiffPageProvider>
  );
}

export default App;
