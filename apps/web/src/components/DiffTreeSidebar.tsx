import type { DiffFile } from "@diffview/shared";

import { TreeView, type TreeDataItem } from "./ui/tree-view";

type DiffTreeSidebarProps = {
  files: DiffFile[];
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
  for (const file of files) insertNode(nodes, file.path.split("/"), file);
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

function toTreeData(items: TreeNode[]): TreeDataItem[] {
  return items.map((item) => ({
    id: item.path,
    name: item.name,
    children: item.children.length ? toTreeData(item.children) : undefined,
  }));
}

function DiffTreeSidebar({ files, onSelectFile }: DiffTreeSidebarProps) {
  const tree = toTreeData(buildTree(files));

  return (
    <aside className="min-h-0 overflow-y-auto border-r border-border bg-card/30 p-3">
      <div className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">Changed files</div>
      <TreeView
        data={tree}
        renderItem={({ item, depth, open, toggle }) => {
          const isFolder = !!item.children?.length;
          const file = files.find((f) => f.path === item.id);

          return (
            <button
              type="button"
              onClick={() => {
                if (isFolder) {
                  toggle();
                  return;
                }
                if (file) onSelectFile(file);
              }}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted"
              style={{ paddingLeft: 8 + depth * 12 }}
            >
              <span className="w-3" />
              <span className="truncate">{item.name}</span>
              {isFolder ? <span className="ml-auto text-xs text-muted-foreground">{open ? "−" : "+"}</span> : null}
            </button>
          );
        }}
      />
    </aside>
  );
}

export default DiffTreeSidebar;
