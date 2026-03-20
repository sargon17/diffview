#!/usr/bin/env bun

import { spawn } from 'bun';
import open from 'open';
import { createServer } from '@diffview/api';

// Parse CLI arguments
const args = Bun.argv.slice(2); // Skip 'bun' and script path

const options = {
  port: 3000,
  noOpen: false,
  base: 'main',
  mode: 'branch' as const,
  editor: ''
};

for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (arg === '--port' && args[i + 1]) {
    options.port = parseInt(args[++i], 10);
  } else if (arg === '--no-open') {
    options.noOpen = true;
  } else if (arg === '--base' && args[i + 1]) {
    options.base = args[++i];
  } else if (arg === '--staged') {
    options.mode = 'staged';
  } else if (arg === '--working') {
    options.mode = 'working';
  } else if (arg === '--editor' && args[i + 1]) {
    options.editor = args[++i];
  } else if (arg === '--help' || arg === '-h') {
    console.log(`
Diffview - CLI-first local Git diff viewer

Usage:
  diffview [options]

Options:
  --port <num>      Port for the backend server (default: 3000)
  --no-open         Don't open browser automatically
  --base <branch>   Base branch for branch mode (default: main)
  --staged          Show staged changes (index vs HEAD)
  --working         Show working tree changes (HEAD vs working directory)
  --editor <cmd>    Open changed file in editor (e.g. zed, code, nvim)
  --help, -h        Show this help message

Examples:
  diffview                 # Open UI with branch diff vs main
  diffview --staged        # Show staged changes
  diffview --working       # Show working changes
  diffview --base develop  # Compare current branch against develop
    `);
    process.exit(0);
  }
}

// Validate we're in a git repo
try {
  const check = Bun.spawn(['git', 'rev-parse', '--is-inside-work-tree'], {
    cwd: process.cwd(),
    stdout: 'pipe',
    stderr: 'pipe'
  });
  const stdout = await check.stdout?.text();
  if (stdout?.trim() !== 'true') {
    console.error('Error: Not inside a Git repository');
    process.exit(1);
  }
} catch {
  console.error('Error: Git is required but not found');
  process.exit(1);
}

// Start server
const server = createServer(options.port);

// Wait for server to be ready
await Bun.sleep(500);

if (!options.noOpen) {
  const url = `http://localhost:${options.port}`;
  try {
    await open(url);
    console.log(`Opened ${url} in browser`);
  } catch (err) {
    console.log(`Server ready at ${url} (failed to open browser automatically)`);
  }
} else {
  console.log(`Server ready at http://localhost:${options.port}`);
}

// Handle shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down Diffview...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  process.exit(0);
});

// Keep process alive
await new Promise(() => {});
