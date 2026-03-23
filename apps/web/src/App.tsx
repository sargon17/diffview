import { useEffect, useMemo, useState } from "react";

import type { DiffFile, DiffRequest, DiffResult, SessionInfo } from "@diffview/shared";
import { Virtualizer } from "@pierre/diffs/react";

import Header from "./components/Header";
import Patch from "./components/Patch";
import { fetchData } from "@utils/http";
import { useDiffModeStore } from "./store/diff-mode.store";

type TreeNode = {
  name: string;
  path: string;
  children: TreeNode[];
};

function buildTree(files: DiffFile[]): TreeNode[] {
  const root = new Map<string, TreeNode>();

  for (const file of files) {
    const parts = file.path.split("/");
    let currentPath = "";
    let currentChildren = root;

    parts.forEach((part, index) => {
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      let node = currentChildren.get(currentPath);
      if (!node) {
        node = { name: part, path: currentPath, children: [] };
        currentChildren.set(currentPath, node);
      }
      if (index < parts.length - 1) {
        const next = new Map(node.children.map((child) => [child.path, child]));
        currentChildren = next;
        node.children = Array.from(next.values());
      }
    });
  }

  const nodes = Array.from(root.values());
  const sort = (items: TreeNode[]): TreeNode[] =>
    items
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((item) => ({ ...item, children: sort(item.children) }));
  return sort(nodes);
}

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

  const tree = useMemo(() => buildTree(diff?.files ?? []), [diff]);

  return (
    <div className="flex h-dvh min-h-screen flex-col bg-background text-foreground">
      <Header />
      <div className="grid min-h-0 flex-1 grid-cols-[280px_minmax(0,1fr)_300px] overflow-hidden">
        <aside className="min-h-0 overflow-y-auto border-r border-border bg-card/30 p-3">
          <div className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">Changed files</div>
          <div className="space-y-1">
            {diff?.files.map((file) => (
              <div key={file.path} className="rounded-md px-3 py-2 text-sm hover:bg-muted">
                {file.path}
              </div>
            ))}
          </div>
        </aside>

        <main className="min-h-0 overflow-hidden">
          <Virtualizer className="h-full min-h-0 overflow-y-auto p-3">
            {diff?.files.map((file) =>
              file.patch ? <Patch key={file.path} patch={file.patch} file={file.path} /> : null,
            )}
          </Virtualizer>
        </main>

        <aside className="min-h-0 overflow-y-auto border-l border-border bg-card/30 p-3">
          <div className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">Tree</div>
          <Tree nodes={tree} />
        </aside>
      </div>
    </div>
  );
}

function Tree({ nodes, depth = 0 }: { nodes: TreeNode[]; depth?: number }) {
  return (
    <div className="space-y-1">
      {nodes.map((node) => (
        <div key={node.path}>
          <div className="rounded-md px-2 py-1.5 text-sm hover:bg-muted" style={{ paddingLeft: 8 + depth * 12 }}>
            {node.name}
          </div>
          {node.children.length > 0 ? <Tree nodes={node.children} depth={depth + 1} /> : null}
        </div>
      ))}
    </div>
  );
}

export default App;
