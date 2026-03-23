import { useEffect, useMemo, useState } from "react";

import type { DiffFile, DiffMode, RefsResponse, SessionInfo } from "@diffview/shared";
import Header from "./components/Header";
import Patch from "./components/Patch";
import { TreeView } from "./components/ui/tree-view";
import { fetchData } from "./utils/http";
import { useDiffModeStore } from "src/store/diff-mode.store";

function App() {
  const mode = useDiffModeStore((s) => s.current);
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [branches, setBranches] = useState<string[]>([]);
  const [baseBranch, setBaseBranch] = useState("");
  const [files, setFiles] = useState<DiffFile[]>([]);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [patch, setPatch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const selectedFile = useMemo(
    () => files.find((file) => file.path === selectedPath) ?? files[0] ?? null,
    [files, selectedPath],
  );

  const loadDiff = async (nextMode: DiffMode, nextBase: string, currentBranch: string) => {
    const result = await fetchData<{ files: DiffFile[] }>("/diff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: nextMode,
        base: nextMode === "branch" ? nextBase : undefined,
        head: currentBranch,
      }),
    });

    if (!result.ok) throw new Error(result.error);

    setFiles(result.data.files);
    const first = result.data.files.find((file) => file.path === selectedPath) ?? result.data.files[0] ?? null;
    setSelectedPath(first?.path ?? null);
    setPatch(first?.patch ?? "");
  };

  useEffect(() => {
    const load = async () => {
      try {
        const sess = await fetchData<SessionInfo>("/session");
        if (!sess.ok) throw new Error(sess.error);
        setSession(sess.data);
        setBaseBranch(sess.data.defaultBaseRef);

        const refs = await fetchData<RefsResponse>("/refs");
        if (!refs.ok) throw new Error(refs.error);
        setBranches(refs.data.branches.map((b) => b.name).filter((name) => name !== sess.data.currentBranch));

        await loadDiff(sess.data.mode, sess.data.defaultBaseRef, sess.data.currentBranch);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load diffview");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  useEffect(() => {
    if (!session) return;
    loadDiff(mode, baseBranch, session.currentBranch).catch((e) => {
      setError(e instanceof Error ? e.message : "Failed to refresh diff");
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, baseBranch]);

  if (loading) {
    return <div className="flex h-dvh items-center justify-center bg-background text-sm text-muted-foreground">Loading diffview…</div>;
  }

  if (error || !session) {
    return <div className="flex h-dvh items-center justify-center bg-background text-sm text-destructive">{error || "Failed to load session"}</div>;
  }

  return (
    <div className="flex h-dvh flex-col bg-background text-foreground">
      <Header />

      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-3 text-sm">
          <div className="font-medium">{session.repo.name}</div>
          <div className="text-muted-foreground">{session.currentBranch}</div>
        </div>

        <div className="flex items-center gap-2">
          <select
            className="h-9 rounded-md border border-input bg-card px-3 text-sm"
            value={baseBranch}
            onChange={(e) => setBaseBranch(e.target.value)}
            disabled={mode !== "branch"}
          >
            {branches.map((branch) => (
              <option key={branch} value={branch}>
                {branch}
              </option>
            ))}
          </select>
        </div>
      </div>

      <main className="grid min-h-0 flex-1 grid-cols-[280px_minmax(0,1fr)_320px] overflow-hidden">
        <aside className="min-h-0 overflow-auto border-r border-border bg-card/40 p-3">
          <div className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">Changed files</div>
          <div className="space-y-1">
            {files.map((file) => (
              <button
                key={file.path}
                onClick={() => {
                  setSelectedPath(file.path);
                  setPatch(file.patch ?? "");
                }}
                className={`w-full rounded-md px-3 py-2 text-left text-sm transition ${selectedPath === file.path ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
              >
                {file.path}
              </button>
            ))}
            {!files.length && <div className="text-sm text-muted-foreground">No files changed.</div>}
          </div>
        </aside>

        <section className="min-h-0 overflow-hidden bg-background">
          <div className="h-full min-h-0 overflow-auto p-3">
            {selectedFile ? <Patch patch={patch} file={selectedFile.path} /> : <div className="text-sm text-muted-foreground">Pick a file to inspect its diff.</div>}
          </div>
        </section>

        <aside className="min-h-0 overflow-auto border-l border-border bg-card/40 p-3">
          <div className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">Tree</div>
          <TreeView files={files} selectedPath={selectedPath} onSelect={(file) => {
            setSelectedPath(file.path);
            setPatch(file.patch ?? "");
          }} />
        </aside>
      </main>
    </div>
  );
}

export default App;
