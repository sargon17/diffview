import * as React from "react";

import { IconChevronRight, IconFolder, IconFolderOpen, IconFile } from "@tabler/icons-react";
import { cn } from "@/lib/utils";

export type TreeDataItem = {
  id: string;
  name: string;
  children?: TreeDataItem[];
};

type TreeProps = {
  data: TreeDataItem[] | TreeDataItem;
  className?: string;
  renderItem?: (params: {
    item: TreeDataItem;
    depth: number;
    open: boolean;
    selected: boolean;
    toggle: () => void;
  }) => React.ReactNode;
};

type TreeNode = {
  name: string;
  path: string;
  children: TreeNode[];
};

function insertNode(nodes: TreeNode[], parts: string[], prefix = ""): void {
  const [head, ...rest] = parts;
  const path = prefix ? `${prefix}/${head}` : head;
  let node = nodes.find((n) => n.name === head);
  if (!node) {
    node = { name: head, path, children: [] };
    nodes.push(node);
  }

  if (rest.length === 0) return;

  insertNode(node.children, rest, path);
}

function buildTree(data: TreeDataItem[] | TreeDataItem): TreeNode[] {
  const items = Array.isArray(data) ? data : [data];
  const nodes: TreeNode[] = [];
  for (const item of items) {
    insertNode(nodes, item.id.split("/"));
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

export function TreeView({ data, className, renderItem }: TreeProps) {
  const tree = React.useMemo(() => buildTree(data), [data]);
  return (
    <div className={cn("space-y-1", className)}>
      {tree.map((item) => (
        <TreeItem key={item.path} item={item} depth={0} renderItem={renderItem} />
      ))}
    </div>
  );
}

function TreeItem({ item, depth, renderItem }: { item: TreeNode; depth: number; renderItem?: TreeProps["renderItem"] }) {
  const hasChildren = item.children.length > 0;
  const [open, setOpen] = React.useState(true);

  const selected = false;
  const toggle = () => setOpen((v) => !v);

  return (
    <div>
      {renderItem ? (
        renderItem({
          item: { id: item.path, name: item.name, children: item.children.map((child) => ({ id: child.path, name: child.name, children: child.children.length ? child.children.map((grand) => ({ id: grand.path, name: grand.name, children: grand.children.length ? [] : undefined })) : undefined })) },
          depth,
          open,
          selected,
          toggle,
        })
      ) : (
        <button
          type="button"
          onClick={() => {
            if (hasChildren) setOpen((v) => !v);
          }}
          className={cn(
            "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted",
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
      )}
      {hasChildren && open ? (
        <div className="space-y-1">
          {item.children.map((child) => (
            <TreeItem key={child.path} item={child} depth={depth + 1} renderItem={renderItem} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
