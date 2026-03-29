import { BranchRef, DiffMode } from "@diffview/shared";
import { spawn } from "bun";

async function execGit(args: string[], allowExitCodes: number[] = [0]): Promise<string> {
  const proc = spawn(["git", ...args], {
    cwd: process.cwd(),
    stdout: "pipe",
    stderr: "pipe",
  });
  const stdout = proc.stdout ? await new Response(proc.stdout).text() : "";
  const stderr = proc.stderr ? await new Response(proc.stderr).text() : "";
  const exitCode = await proc.exited;

  if (!allowExitCodes.includes(exitCode)) {
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
    .map((name) => ({ name: name.trim().replace(/^[* ]+/, ""), isRemote: false }));
  try {
    const remote = await execGit(["branch", "-r", "--list"]);
    remote
      .split("\n")
      .filter(Boolean)
      .forEach((line) => {
        const name = line.trim();
        if (name) branches.push({ name, isRemote: true });
      });
  } catch {
    // ignore missing remotes
  }
  return branches;
}

async function getUntrackedFiles(): Promise<string[]> {
  const output = await execGit(["status", "--porcelain=v1", "--untracked-files=all", "-z"]);
  return output
    .split("\0")
    .filter((line) => line.startsWith("?? "))
    .map((line) => line.slice(3))
    .filter(Boolean);
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
    const tracked = await execGit(args);
    const untracked = await getUntrackedFiles();
    return [...tracked.split("\n").filter(Boolean), ...untracked.map((file) => `A\t${file}`)];
  } else if (mode === "branch" && base && head) {
    args.push(`${base}..${head}`);
  }
  const output = await execGit(args);
  return output.split("\n").filter(Boolean);
}

async function getUntrackedPatch(file: string): Promise<string> {
  try {
    return await execGit(["diff", "--no-index", "--binary", "--", "/dev/null", file], [0, 1]);
  } catch {
    return "";
  }
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
    const trackedPatch = await execGit(args);
    const untracked = await getUntrackedFiles();
    const untrackedPatches = await Promise.all(untracked.map((file) => getUntrackedPatch(file)));
    return [trackedPatch, ...untrackedPatches].filter(Boolean).join("\n");
  } else if (mode === "branch" && base && head) {
    args.push(`${base}..${head}`);
  }
  return execGit(args);
}

export function splitPatchByFile(patch: string): Map<string, string> {
  const files = new Map<string, string>();
  const lines = patch.split("\n");
  let currentFile = "";
  let currentPatch: string[] = [];
  const flush = () => {
    if (currentFile) files.set(currentFile, currentPatch.join("\n"));
  };
  for (const line of lines) {
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
