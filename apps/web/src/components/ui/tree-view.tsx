import * as React from "react";

import { IconChevronRight, IconFolder, IconFolderOpen, IconFile } from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import type { DiffFile } from "@diffview/shared";

export type TreeDataItem = {
  id: string;
  name: string;
  children?: TreeDataItem[];
  onClick?: () => void;
};

type TreeProps = {
  files: DiffFile[];
  className?: string;
  onSelectFile: (file: DiffFile) => void;
};

type TreeNode = {
  name: string;
  path: string;
  children: TreeNode[];
  file?: DiffFile;
};

function insertNode(nodes: TreeNode[], parts: string[], file: DiffFile, prefix = ""): void {
  const [head, ...rest] = parts;
  const path = prefix ? `${prefix}/${head}` : head;
  let node = nodes.find((n) => n.name === head);
  if (!node) {
    node = { name: head, path, children: [] };
    nodes.push(node);
  }

  if (rest.length === 0) {
    node.file = file;
    return;
  }

  insertNode(node.children, rest, file, path);
}

function buildTree(files: DiffFile[]): TreeNode[] {
  const nodes: TreeNode[] = [];
  for (const file of files) {
    insertNode(nodes, file.path.split("/"), file);
  }
  const sort = (items: TreeNode[]): TreeNode[] =>
    items
      .sort((a, b) => {
        const folderA = a.children.length > 0;
        const folderB = b.children.length > 0;
        if (folderA !== folderB) return folderA ? -1 : 1;
        return a.name.localeCompare(b.name);
      })
      .map((item) => ({ ...item, children: sort(item.children) }));
  return sort(nodes);
}

export function TreeView({ files, className, onSelectFile }: TreeProps) {
  const tree = React.useMemo(() => buildTree(files), [files]);
  return (
    <div className={cn("space-y-1", className)}>
      {tree.map((item) => (
        <TreeItem key={item.path} item={item} depth={0} onSelectFile={onSelectFile} />
      ))}
    </div>
  );
}

function TreeItem({ item, depth, onSelectFile }: { item: TreeNode; depth: number; onSelectFile: (file: DiffFile) => void }) {
  const hasChildren = item.children.length > 0;
  const [open, setOpen] = React.useState(true);

  return (
    <div>
      <button
        type="button"
        onClick={() => {
          if (hasChildren) {
            setOpen((v) => !v);
            return;
          }
          if (item.file) onSelectFile(item.file);
        }}
        className={cn(
          "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted",
          item.file && "text-foreground",
        )}
        style={{ paddingLeft: 8 + depth * 12 }}
      >
        {hasChildren ? (
          <IconChevronRight className={cn("size-3 text-muted-foreground transition-transform", open && "rotate-90")} />
        ) : (
          <span className="w-3" />
        )}
        {hasChildren ? (
          open ? <IconFolderOpen className="size-4 text-muted-foreground" /> : <IconFolder className="size-4 text-muted-foreground" />
        ) : (
          <IconFile className="size-4 text-muted-foreground" />
        )}
        <span className="truncate">{item.name}</span>
      </button>
      {hasChildren && open ? (
        <div className="space-y-1">
          {item.children.map((child) => (
            <TreeItem key={child.path} item={child} depth={depth + 1} onSelectFile={onSelectFile} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
