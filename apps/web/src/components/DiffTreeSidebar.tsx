import type { DiffFile } from "@diffview/shared";

import { TreeView } from "./ui/tree-view";

type DiffTreeSidebarProps = {
  files: DiffFile[];
  onSelectFile: (file: DiffFile) => void;
  isLoading?: boolean;
};

function DiffTreeSidebar({ files, onSelectFile, isLoading }: DiffTreeSidebarProps) {
  return (
    <aside aria-label="Changed files" className="min-h-0 overflow-y-auto border-r border-border bg-card/30 p-3">
      <div className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">Changed files</div>
      {isLoading ? (
        <div className="text-sm text-muted-foreground">Loading changed files...</div>
      ) : (
        <TreeView files={files} onSelectFile={onSelectFile} />
      )}
    </aside>
  );
}

export default DiffTreeSidebar;
