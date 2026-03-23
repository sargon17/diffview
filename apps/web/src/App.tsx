import { useEffect, useMemo, useState } from "react";

import type { DiffFile, DiffMode, RefsResponse, SessionInfo } from "@diffview/shared";
import { Button } from "./components/ui/button";
import Patch from "./components/Patch";

type TreeNode = {
  name: string;
  path: string;
  children: TreeNode[];
  file?: DiffFile;
};

const API_BASE = "";

function buildTree(files: DiffFile[]) {
  const root: TreeNode = { name: "", path: "", children: [] };
  const map = new Map<string, TreeNode>([["", root]]);

  for (const file of files) {
    const parts = file.path.split("/");
    let current = root;
    let currentPath = "";

    parts.forEach((part, index) => {
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      let node = map.get(currentPath);

      if (!node) {
        node = { name: part, path: currentPath, children: [] };
        map.set(currentPath, node);
        current.children.push(node);
      }

      if (index === parts.length - 1) node.file = file;
      else current = node;
    });
  }

  const sortTree = (nodes: TreeNode[]) => {
    nodes.sort((a, b) => {
      const aFolder = a.children.length > 0;
      const bFolder = b.children.length > 0;
      if (aFolder !== bFolder) return aFolder ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
    nodes.forEach((node) => sortTree(node.children));
    return nodes;
  };

  return sortTree(root.children);
}

function App() {
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [branches, setBranches] = useState<string[]>([]);
  const [mode, setMode] = useState<DiffMode>("branch");
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
  const tree = useMemo(() => buildTree(files), [files]);

  useEffect(() => {
    const load = async () => {
      try {
        const sess = await fetch(`${API_BASE}/session`).then((r) => r.json() as Promise<SessionInfo>);
        setSession(sess);
        setMode(sess.mode);
        setBaseBranch(sess.defaultBaseRef);

        const refs = await fetch(`${API_BASE}/refs`).then((r) => r.json() as Promise<RefsResponse>);
        setBranches(refs.branches.map((b) => b.name).filter((name) => name !== sess.currentBranch));

        const initial = await fetch(`${API_BASE}/diff`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mode: sess.mode,
            base: sess.defaultBaseRef,
            head: sess.currentBranch,
          }),
        }).then((r) => r.json() as Promise<{ files: DiffFile[] }>);

        setFiles(initial.files);
        const first = initial.files[0] ?? null;
        setSelectedPath(first?.path ?? null);
        setPatch(first?.patch ?? "");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load diffview");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const refresh = async (nextMode = mode, nextBase = baseBranch) => {
    if (!session) return;
    setLoading(true);
    try {
      const result = await fetch(`${API_BASE}/diff`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: nextMode,
          base: nextMode === "branch" ? nextBase : undefined,
          head: session.currentBranch,
        }),
      }).then((r) => r.json() as Promise<{ files: DiffFile[] }>);

      setFiles(result.files);
      const nextSelected = result.files.find((file) => file.path === selectedFile?.path) ?? result.files[0] ?? null;
      setSelectedPath(nextSelected?.path ?? null);
      setPatch(nextSelected?.patch ?? "");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to refresh diff");
    } finally {
      setLoading(false);
    }
  };

  const selectFile = (file: DiffFile) => {
    setSelectedPath(file.path);
    setPatch(file.patch ?? "");
  };

  if (loading) {
    return <div className="flex h-dvh items-center justify-center bg-background text-sm text-muted-foreground">Loading diffview…</div>;
  }

  if (error || !session) {
    return <div className="flex h-dvh items-center justify-center bg-background text-sm text-destructive">{error || "Failed to load session"}</div>;
  }

  return (
    <div className="flex h-dvh flex-col bg-background text-foreground">
      <header className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-3 text-sm">
          <div className="font-medium">{session.repo.name}</div>
          <div className="text-muted-foreground">{session.currentBranch}</div>
        </div>

        <div className="flex items-center gap-2">
          <select
            className="h-9 rounded-md border border-input bg-card px-3 text-sm"
            value={mode}
            onChange={(e) => {
              const next = e.target.value as DiffMode;
              setMode(next);
              refresh(next, baseBranch);
            }}
          >
            <option value="branch">Branch</option>
            <option value="working">Working</option>
            <option value="staged">Staged</option>
          </select>

          {mode === "branch" && (
            <select
              className="h-9 rounded-md border border-input bg-card px-3 text-sm"
              value={baseBranch}
              onChange={(e) => {
                const next = e.target.value;
                setBaseBranch(next);
                refresh(mode, next);
              }}
            >
              {branches.map((branch) => (
                <option key={branch} value={branch}>
                  {branch}
                </option>
              ))}
            </select>
          )}

          <Button variant="outline" size="sm" onClick={() => refresh()}>
            Refresh
          </Button>
        </div>
      </header>

      <main className="grid min-h-0 flex-1 grid-cols-[280px_minmax(0,1fr)_320px] overflow-hidden">
        <aside className="min-h-0 overflow-auto border-r border-border bg-card/40 p-3">
          <div className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">Changed files</div>
          <div className="space-y-1">
            {files.map((file) => (
              <button
                key={file.path}
                onClick={() => selectFile(file)}
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
          <TreeView nodes={tree} selectedPath={selectedPath} onSelect={selectFile} />
        </aside>
      </main>
    </div>
  );
}

function TreeView({
  nodes,
  selectedPath,
  onSelect,
  depth = 0,
}: {
  nodes: TreeNode[];
  selectedPath: string | null;
  onSelect: (file: DiffFile) => void;
  depth?: number;
}) {
  return (
    <div className="space-y-1">
      {nodes.map((node) => {
        const isSelected = node.path === selectedPath;
        const isFolder = node.children.length > 0;
        return (
          <div key={node.path}>
            <button
              onClick={() => node.file && onSelect(node.file)}
              className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition ${
                isSelected ? "bg-primary text-primary-foreground" : "hover:bg-muted"
              }`}
              style={{ paddingLeft: `${depth * 12 + 8}px` }}
            >
              <span className="w-4 text-xs text-muted-foreground">{isFolder ? "▾" : "•"}</span>
              <span className="truncate">{node.name}</span>
            </button>
            {isFolder && <TreeView nodes={node.children} selectedPath={selectedPath} onSelect={onSelect} depth={depth + 1} />}
          </div>
        );
      })}
    </div>
  );
}

export default App;
