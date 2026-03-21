import { BranchRef, DiffFile, DiffMode } from "@diffview/shared";
import { spawn } from "bun";

async function execGit(args: string[]): Promise<string> {
  const proc = spawn(["git", ...args], {
    cwd: process.cwd(),
    stdout: "pipe",
    stderr: "pipe",
  });
  const stdout = proc.stdout ? await new Response(proc.stdout).text() : "";
  const stderr = proc.stderr ? await new Response(proc.stderr).text() : "";
  const exitCode = await proc.exited;

  if (exitCode !== 0) {
    throw new Error(`git ${args.join(" ")}: ${stderr.trim()}`);
  }
  return stdout?.trim() ?? "";
}

export async function getRepoRoot(): Promise<string> {
  return execGit(["rev-parse", "--show-toplevel"]);
}

export async function getCurrentBranch(): Promise<string> {
  return execGit(["branch", "--show-current"]);
}

export async function getBranches(): Promise<BranchRef[]> {
  const local = await execGit(["branch", "--list"]);
  const branches = local
    .split("\n")
    .filter(Boolean)
    .map((name) => ({
      name: name.trim().replace(/^[* ]+/, ""),
      isRemote: false,
    }));

  try {
    const remote = await execGit(["branch", "-r", "--list"]);
    remote
      .split("\n")
      .filter(Boolean)
      .forEach((line) => {
        const name = line.trim();
        if (name) {
          branches.push({ name, isRemote: true });
        }
      });
  } catch {
    // remotes not available, ignore
  }

  return branches;
}

export async function getDiffFiles(
  mode: DiffMode,
  base?: string,
  head?: string,
): Promise<string[]> {
  let args = ["diff", "--name-status"];
  if (mode === "staged") {
    args.push("--cached");
  } else if (mode === "working") {
    // working mode: compare HEAD to working tree
  } else if (mode === "branch" && base && head) {
    args.push(`${base}..${head}`);
  }
  const output = await execGit(args);
  return output.split("\n").filter(Boolean);
}

export async function getDiffPatches(
  mode: DiffMode,
  base?: string,
  head?: string,
): Promise<string> {
  let args = ["diff", "--patch"];
  if (mode === "staged") {
    args.push("--cached");
  } else if (mode === "working") {
    // HEAD vs working tree
  } else if (mode === "branch" && base && head) {
    args.push(`${base}..${head}`);
  }
  return execGit(args);
}

export function parseDiffFiles(rawList: string[]): DiffFile[] {
  return rawList.map((line) => {
    const parts = line.split("\t");
    if (parts.length === 2) {
      return {
        path: parts[1],
        status:
          parts[0] === "A"
            ? "added"
            : parts[0] === "M"
              ? "modified"
              : parts[0] === "D"
                ? "deleted"
                : parts[0] === "R"
                  ? "renamed"
                  : "modified",
        oldPath: parts[0] === "R" ? parts[0] : undefined,
      };
    }
    return {
      path: parts[0],
      status:
        parts[0] === "A"
          ? "added"
          : parts[0] === "M"
            ? "modified"
            : parts[0] === "D"
              ? "deleted"
              : "modified",
    };
  });
}

export function splitPatchByFile(patch: string): Map<string, string> {
  const files = new Map<string, string>();
  const lines = patch.split("\n");
  let currentFile = "";
  let currentPatch: string[] = [];

  const flush = () => {
    if (currentFile) {
      files.set(currentFile, currentPatch.join("\n"));
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const fileMatch = line.match(/^diff --git a\/(.+?) b\/(.+?)$/);
    if (fileMatch) {
      flush();
      currentFile = fileMatch[2];
      currentPatch = [line];
    } else {
      currentPatch.push(line);
    }
  }
  flush();

  return files;
}
