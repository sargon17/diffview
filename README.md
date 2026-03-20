# Diffview

A CLI-first local Git diff viewer with a modern web UI.

Diffview lets you jump from terminal → browser → diff in one command, while staying minimal and fast.

⸻

✨ Overview

Diffview is a thin layer on top of Git and a diff rendering library.

It does not replace Git.
It visualizes Git in a better way.

Core idea:

You are already inside a repo → run a command → instantly see your diff in the browser.

⸻

🚀 Core Workflow

1. Developer enters a repo

cd my-project

2. Runs the CLI

diffview

3. Tool bootstraps session
 • detects repo from cwd
 • resolves repo root
 • detects current branch
 • selects default base branch (main → fallback logic)
 • starts local backend
 • opens browser

⸻

4. UI opens automatically

Initial state:
 • repo: my-project
 • current branch: feature/auth
 • base branch: main
 • mode: branch

You immediately see:

main → feature/auth diff

⸻

5. User interacts in UI

User can:
 • change base branch
 • switch diff mode (branch / working / staged)
 • filter files
 • toggle split/unified view
 • inspect file diffs

⸻

🧠 Design Principles

1. Git is the source of truth
 • no reimplementation of Git
 • always shell out to git

2. Thin architecture
 • minimal layers
 • no database
 • no auth
 • no background jobs

3. CLI-first UX
 • no repo picker UI
 • one repo per session

4. Local-first
 • runs entirely on your machine
 • no network dependency

5. Replaceable backend
 • backend is stateless and simple
 • can be swapped (Node → Rust later)

⸻

🏗 Architecture

System has 3 layers:

CLI → API → Web UI


⸻

1. CLI Layer

Responsibilities
 • parse arguments
 • detect repo from cwd
 • validate Git repo
 • detect current branch
 • choose base branch
 • start backend
 • open browser
 • pass launch context

Example

diffview
diffview --base main
diffview --staged


⸻

2. Backend (API)

Responsibilities
 • execute Git commands
 • parse Git output
 • normalize data
 • expose HTTP API

Important rule

Backend is just a translator between UI and Git

⸻

3. Web UI

Responsibilities
 • render diff
 • manage UI state
 • handle user interactions
 • call API

⸻

📦 Tech Stack

Frontend
 • React
 • Vite
 • TypeScript
 • @pierre/diffs (diff renderer)

Backend
 • Bun runtime
 • HTTP server
 • git via subprocess

CLI
 • Bun / Node CLI
 • minimal argument parser

Monorepo
 • Bun workspaces

⸻

📁 Repo Structure

diffview/
 apps/
 web/ # React + Vite UI
 api/ # Bun backend
 cli/ # CLI entrypoint

 packages/
 shared/ # shared types / DTOs


⸻

🧩 Layered Architecture

Backend

routes/
 → HTTP layer

services/
 → orchestrates logic

git/
 → executes git commands

parsers/
 → transforms git output

domain/
 → internal types


⸻

Frontend

components/
 → UI

features/
 → domain logic (diff, repo, compare)

lib/api/
 → HTTP client

app/
 → layout and composition


⸻

🔌 Core API

Session

GET /session

Returns:

{
 repo: { path, name },
 currentBranch,
 defaultBaseRef,
 mode
}


⸻

Refs

GET /refs

Returns:
 • branches
 • (optional) remote branches

⸻

Diff

POST /diff

Examples:

{ mode: "branch", base: "main", head: "feature/x" }

{ mode: "working" }

{ mode: "staged" }


⸻

🔍 Diff Modes

1. Branch (default)

Compare:

base → current branch

Example:

main → feature/auth


⸻

2. Working

Compare:

working tree → HEAD


⸻

3. Staged

Compare:

index → HEAD


⸻

📊 Data Model

ChangedFile

type ChangedFile = {
 path: string;
 oldPath?: string;
 status: "added" | "modified" | "deleted" | "renamed";
 binary?: boolean;
};


⸻

DiffFile

type DiffFile = {
 path: string;
 status: string;
 patch?: string;
};


⸻

DiffResult

type DiffResult = {
 mode: "branch" | "working" | "staged";
 files: DiffFile[];
};


⸻

⚙️ Git Command Strategy

Repo detection

git rev-parse --show-toplevel


⸻

Current branch

git branch --show-current


⸻

File list

git diff --name-status
git diff --cached --name-status


⸻

Patch

git diff --patch
git diff --cached --patch
git diff base..head --patch


⸻

🎯 UI Layout

Top Bar
 • repo name
 • current branch
 • base branch selector
 • mode selector
 • layout toggle

⸻

Sidebar
 • changed files
 • filter input
 • summary

⸻

Main Panel
 • diff viewer
 • file content
 • empty states

⸻

⚡ Performance Strategy
 • render one file at a time
 • avoid rendering all diffs
 • lazy selection
 • optional large file guard
 • minimal parsing in v1

⸻

🔐 Safety
 • require absolute repo path
 • validate .git
 • no shell string interpolation
 • sanitize inputs

⸻

🧪 Future Extensions

Semantic Diff (via sem)
 • function-level changes
 • class-level changes
 • impact analysis
 • entity navigation

CLI enhancements

diffview --no-open
diffview --port 4000
diffview --editor zed

UI enhancements
 • commit comparison
 • recent repos
 • keyboard navigation

⸻

🧭 Roadmap

v1
 • CLI launch
 • repo detection
 • branch diff
 • working/staged modes
 • file list
 • diff rendering

⸻

v1.1
 • file filtering
 • better branch selector
 • whitespace toggle
 • open in editor

⸻

v2
 • semantic diff (sem)
 • impact analysis
 • advanced navigation

⸻

💡 Summary

Diffview is:
 • CLI-first
 • local-first
 • Git-native
 • minimal by design

Architecture is intentionally simple:

CLI → Backend → Git
 ↓
 Frontend → Diff Renderer

No unnecessary layers.
No overengineering.
Just a fast way to see your diffs.

⸻

If you want next step, I can:
 • scaffold the repo with real package.json + scripts
 • or design the CLI implementation (bin, args, launch lifecycle) in code-level detail
