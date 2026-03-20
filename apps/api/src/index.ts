import { Server } from 'bun';
import { SessionInfo, BranchRef, DiffMode, DiffFile } from '@diffview/shared';

// Re-export types for CLI
export { SessionInfo, BranchRef, DiffMode, DiffFile };

// --- Git command utilities ---

async function execGit(args: string[]): Promise<string> {
  const proc = Bun.spawn(['git', ...args], {
    cwd: process.cwd(),
    stdout: 'pipe',
    stderr: 'pipe'
  });
  const stdout = await proc.stdout?.text();
  const stderr = await proc.stderr?.text();
  const exitCode = await proc.exited;

  if (exitCode !== 0) {
    throw new Error(`git ${args.join(' ')}: ${stderr.trim()}`);
  }
  return stdout?.trim() ?? '';
}

async function getRepoRoot(): Promise<string> {
  return execGit(['rev-parse', '--show-toplevel']);
}

async function getCurrentBranch(): Promise<string> {
  return execGit(['branch', '--show-current']);
}

async function getBranches(): Promise<BranchRef[]> {
  const local = await execGit(['branch', '--list']);
  const branches = local.split('\n').filter(Boolean).map(name => ({
    name: name.trim().replace(/^[* ]+/, ''),
    isRemote: false
  }));

  try {
    const remote = await execGit(['branch', '-r', '--list']);
    remote.split('\n').filter(Boolean).forEach(line => {
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

async function getDiffFiles(mode: DiffMode, base?: string, head?: string): Promise<string[]> {
  let args = ['diff', '--name-status'];
  if (mode === 'staged') {
    args.push('--cached');
  } else if (mode === 'working') {
    // working mode: compare HEAD to working tree
  } else if (mode === 'branch' && base && head) {
    args.push(`${base}..${head}`);
  }
  const output = await execGit(args);
  return output.split('\n').filter(Boolean);
}

async function getDiffPatches(mode: DiffMode, base?: string, head?: string): Promise<string> {
  let args = ['diff', '--patch'];
  if (mode === 'staged') {
    args.push('--cached');
  } else if (mode === 'working') {
    // HEAD vs working tree
  } else if (mode === 'branch' && base && head) {
    args.push(`${base}..${head}`);
  }
  return execGit(args);
}

function parseDiffFiles(rawList: string[]): DiffFile[] {
  return rawList.map(line => {
    const parts = line.split('\t');
    if (parts.length === 2) {
      return {
        path: parts[1],
        status: parts[0] === 'A' ? 'added' : parts[0] === 'M' ? 'modified' : parts[0] === 'D' ? 'deleted' : parts[0] === 'R' ? 'renamed' : 'modified',
        oldPath: parts[0] === 'R' ? parts[0] : undefined
      };
    }
    return {
      path: parts[0],
      status: parts[0] === 'A' ? 'added' : parts[0] === 'M' ? 'modified' : parts[0] === 'D' ? 'deleted' : 'modified'
    };
  });
}

function splitPatchByFile(patch: string): Map<string, string> {
  const files = new Map<string, string>();
  const lines = patch.split('\n');
  let currentFile = '';
  let currentPatch: string[] = [];

  const flush = () => {
    if (currentFile) {
      files.set(currentFile, currentPatch.join('\n'));
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

// --- HTTP handlers ---

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

async function handleSession(): Promise<Response> {
  try {
    const repoRoot = await getRepoRoot();
    const currentBranch = await getCurrentBranch();
    const branches = await getBranches();
    const mainCandidates = ['main', 'master', 'develop'];
    const defaultBase = branches.find(b => !b.isRemote && mainCandidates.includes(b.name))
      ?.name || branches.find(b => !b.isRemote)?.name || currentBranch;

    const session: SessionInfo = {
      repo: {
        path: repoRoot,
        name: repoRoot.split('/').pop() || 'unknown'
      },
      currentBranch,
      defaultBaseRef: defaultBase,
      mode: 'branch' as DiffMode
    };
    return json(session);
  } catch (err: any) {
    return json({ error: err.message }, 500);
  }
}

async function handleRefs(): Promise<Response> {
  try {
    const branches = await getBranches();
    return json({ branches, remoteBranches: branches.filter(b => b.isRemote) });
  } catch (err: any) {
    return json({ error: err.message }, 500);
  }
}

async function handleDiff(request: Request): Promise<Response> {
  try {
    const body: { mode: DiffMode; base?: string; head?: string } = await request.json();
    const { mode, base, head } = body;

    if (mode === 'branch' && (!base || !head)) {
      return json({ error: 'base and head required for branch mode' }, 400);
    }

    const filesRaw = await getDiffFiles(mode, base, head);
    const files = parseDiffFiles(filesRaw);

    if (files.length === 0) {
      return json({ mode, files: [] });
    }

    const fullPatch = await getDiffPatches(mode, base, head);
    const filePatches = splitPatchByFile(fullPatch);

    const enrichedFiles: DiffFile[] = files.map(f => ({
      ...f,
      patch: filePatches.get(f.path) || ''
    }));

    return json({ mode, files: enrichedFiles });
  } catch (err: any) {
    return json({ error: err.message }, 500);
  }
}

// --- Server factory ---

export function createServer(port = 3000): Server {
  return new Server({
    port,
    fetch: async (req: Request) => {
      const url = new URL(req.url);
      if (url.pathname === '/session' && req.method === 'GET') {
        return handleSession();
      }
      if (url.pathname === '/refs' && req.method === 'GET') {
        return handleRefs();
      }
      if (url.pathname === '/diff' && req.method === 'POST') {
        return handleDiff(req);
      }
      return new Response('Not Found', { status: 404 });
    }
  });
}

// If run directly, start server
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = createServer(3000);
  console.log(`Diffview API running on http://localhost:3000`);
}
