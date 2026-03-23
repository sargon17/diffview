import * as React from "react";

import { IconChevronRight, IconFolder, IconFile } from "@tabler/icons-react";
import { cn } from "@/lib/utils";

export type TreeDataItem = {
  id: string;
  name: string;
  children?: TreeDataItem[];
  className?: string;
  onClick?: () => void;
};

type TreeProps = React.HTMLAttributes<HTMLDivElement> & {
  data: TreeDataItem[] | TreeDataItem;
  expandAll?: boolean;
  renderItem?: (params: {
    item: TreeDataItem;
    depth: number;
    open: boolean;
    selected: boolean;
    toggle: () => void;
  }) => React.ReactNode;
};

export function TreeView({ data, expandAll = true, renderItem, className, ...props }: TreeProps) {
  const items = Array.isArray(data) ? data : [data];
  return (
    <div className={cn("space-y-1", className)} {...props}>
      {items.map((item) => (
        <TreeItem key={item.id} item={item} depth={0} defaultOpen={expandAll} renderItem={renderItem} />
      ))}
    </div>
  );
}

function TreeItem({
  item,
  depth,
  defaultOpen,
  renderItem,
}: {
  item: TreeDataItem;
  depth: number;
  defaultOpen: boolean;
  renderItem?: TreeProps["renderItem"];
}) {
  const hasChildren = !!item.children?.length;
  const [open, setOpen] = React.useState(defaultOpen);
  const toggle = () => setOpen((v) => !v);
  const selected = false;

  return (
    <div>
      {renderItem ? (
        renderItem({ item, depth, open, selected, toggle })
      ) : (
        <button
          type="button"
          onClick={hasChildren ? toggle : item.onClick}
          className={cn(
            "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted",
            item.className,
          )}
          style={{ paddingLeft: 8 + depth * 12 }}
        >
          {hasChildren ? (
            <IconChevronRight className={cn("size-3 text-muted-foreground transition-transform", open && "rotate-90")} />
          ) : (
            <span className="w-3" />
          )}
          {hasChildren ? <IconFolder className="size-4 text-muted-foreground" /> : <IconFile className="size-4 text-muted-foreground" />}
          <span className="truncate">{item.name}</span>
        </button>
      )}
      {hasChildren && open ? (
        <div className="space-y-1">
          {item.children!.map((child) => (
            <TreeItem key={child.id} item={child} depth={depth + 1} defaultOpen={defaultOpen} renderItem={renderItem} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
