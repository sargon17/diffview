import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

async function run(cmd: string[], cwd: string) {
  const proc = Bun.spawn(cmd, {
    cwd,
    stdin: 'inherit',
    stdout: 'inherit',
    stderr: 'inherit'
  });

  const exitCode = await proc.exited;
  if (exitCode !== 0) {
    throw new Error(`Build command failed: ${cmd.join(' ')}`);
  }
}

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const cliRoot = path.resolve(scriptDir, '..');
const repoRoot = path.resolve(cliRoot, '..', '..');
const webRoot = path.join(repoRoot, 'apps/web');
const webDist = path.join(webRoot, 'dist');
const cliDist = path.join(cliRoot, 'dist');

await run(['bun', 'run', 'build'], webRoot);

await rm(cliDist, { recursive: true, force: true });
await mkdir(cliDist, { recursive: true });
await cp(webDist, path.join(cliDist, 'web'), { recursive: true });

await run(['bun', 'build', 'apps/api/src/index.ts', '--outfile', 'apps/cli/dist/api.js', '--minify', '--target=bun'], repoRoot);
await run(['bun', 'build', 'apps/cli/src/index.ts', '--outfile', 'apps/cli/dist/cli.js', '--minify', '--target=bun'], repoRoot);

const cliEntry = path.join(cliDist, 'cli.js');
const cliSource = await readFile(cliEntry, 'utf8');
await writeFile(cliEntry, cliSource.replace(/^#!.*\n/, '#!/usr/bin/env bun\n'), 'utf8');
