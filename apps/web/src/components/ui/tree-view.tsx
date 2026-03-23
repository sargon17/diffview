import { useMemo, useState } from "react";

import { IconChevronDown, IconFolder, IconFolderOpen, IconFile } from "@tabler/icons-react";

import { cn } from "@/lib/utils";
import type { DiffFile } from "@diffview/shared";

type TreeNode = {
  name: string;
  path: string;
  children: TreeNode[];
  file?: DiffFile;
};

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

  const sortNodes = (nodes: TreeNode[]) => {
    nodes.sort((a, b) => {
      const aFolder = a.children.length > 0;
      const bFolder = b.children.length > 0;
      if (aFolder !== bFolder) return aFolder ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
    nodes.forEach((node) => sortNodes(node.children));
    return nodes;
  };

  return sortNodes(root.children);
}

export function TreeView({
  files,
  selectedPath,
  onSelect,
}: {
  files: DiffFile[];
  selectedPath: string | null;
  onSelect: (file: DiffFile) => void;
}) {
  const tree = useMemo(() => buildTree(files), [files]);

  return (
    <div className="space-y-1">
      {tree.map((node) => (
        <TreeNodeView
          key={node.path}
          node={node}
          depth={0}
          selectedPath={selectedPath}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}

function TreeNodeView({
  node,
  depth,
  selectedPath,
  onSelect,
}: {
  node: TreeNode;
  depth: number;
  selectedPath: string | null;
  onSelect: (file: DiffFile) => void;
}) {
  const isFolder = node.children.length > 0;
  const [open, setOpen] = useState(true);
  const isSelected = node.path === selectedPath;

  return (
    <div>
      <button
        type="button"
        onClick={() => (isFolder ? setOpen((v) => !v) : node.file && onSelect(node.file))}
        className={cn(
          "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition hover:bg-muted",
          isSelected && "bg-primary text-primary-foreground hover:bg-primary/90",
        )}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
      >
        <span className="w-4 shrink-0 text-muted-foreground">
          {isFolder ? <IconChevronDown className={cn("size-3 transition-transform", open && "rotate-0", !open && "-rotate-90")} /> : <IconFile className="size-3" />}
        </span>
        <span className="shrink-0 text-muted-foreground">
          {isFolder ? (open ? <IconFolderOpen className="size-3.5" /> : <IconFolder className="size-3.5" />) : null}
        </span>
        <span className="truncate">{node.name}</span>
      </button>

      {isFolder && open && (
        <div className="space-y-1">
          {node.children.map((child) => (
            <TreeNodeView
              key={child.path}
              node={child}
              depth={depth + 1}
              selectedPath={selectedPath}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}
