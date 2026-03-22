export type FileStatus = "added" | "modified" | "deleted" | "renamed";

export interface ChangedFile {
  path: string;
  oldPath?: string;
  status: FileStatus;
  binary?: boolean;
}

export interface DiffFile {
  path: string;
  status: string;
  patch?: string;
}

export const DIFF_MODES = ["branch", "working", "staged"] as const;

export type DiffMode = (typeof DIFF_MODES)[number];

export interface DiffResult {
  mode: DiffMode;
  files: DiffFile[];
}

export interface RepoInfo {
  path: string;
  name: string;
}

export interface SessionInfo {
  repo: RepoInfo;
  currentBranch: string;
  defaultBaseRef: string;
  mode: DiffMode;
}

export interface BranchRef {
  name: string;
  isRemote?: boolean;
}

export interface RefsResponse {
  branches: BranchRef[];
  remoteBranches?: BranchRef[];
}

export interface DiffRequest {
  mode: DiffMode;
  base?: string;
  head?: string;
}
