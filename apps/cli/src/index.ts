#!/usr/bin/env bun
import { existsSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import chalk from "chalk";
import { Command } from "commander";

const program = new Command();

async function waitForServer(url: string, timeoutMs = 15000) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      // not up yet
    }
    await Bun.sleep(200);
  }

  throw new Error(`Timed out waiting for ${url}`);
}

function getInstallDir(): string {
  return path.dirname(fileURLToPath(import.meta.url));
}

function resolveWebRoot(): string {
  const installDir = getInstallDir();
  const candidates = [
    path.join(installDir, "web"),
    path.resolve(installDir, "..", "web"),
    path.resolve(installDir, "..", "..", "web", "dist"),
    path.resolve(installDir, "..", "..", "apps", "web", "dist"),
  ];

  for (const candidate of candidates) {
    const indexHtml = path.join(candidate, "index.html");
    if (existsSync(indexHtml) && statSync(indexHtml).isFile()) {
      return candidate;
    }
  }

  throw new Error(
    `Unable to locate built web assets. Expected them next to the CLI executable under "${path.join(installDir, "web")}".`,
  );
}

function startAppServer(apiFetch: (req: Request) => Promise<Response>, webRoot: string, port = 0) {
  return Bun.serve({
    port,
    async fetch(req: Request) {
      const url = new URL(req.url);
      if (url.pathname === "/session" || url.pathname === "/refs" || url.pathname === "/diff") {
        return apiFetch(req);
      }
      const pathname = decodeURIComponent(url.pathname === "/" ? "/index.html" : url.pathname);
      const filePath = path.normalize(path.join(webRoot, pathname));
      const relative = path.relative(webRoot, filePath);

      if (relative.startsWith("..") || path.isAbsolute(relative)) {
        return new Response("Forbidden", { status: 403 });
      }

      if (!existsSync(filePath) || statSync(filePath).isDirectory()) {
        return new Response("Not Found", { status: 404 });
      }

      return new Response(Bun.file(filePath));
    },
  });
}

async function resolveRepoRoot(fromPath: string): Promise<string> {
  const proc = Bun.spawn(["git", "rev-parse", "--show-toplevel"], {
    cwd: fromPath,
    stdout: "pipe",
    stderr: "pipe",
  });

  const stdout = proc.stdout ? await new Response(proc.stdout).text() : "";
  const stderr = proc.stderr ? await new Response(proc.stderr).text() : "";
  const exitCode = await proc.exited;

  if (exitCode !== 0 || !stdout) {
    throw new Error(
      `Unable to find a git repository from ${fromPath}: ${stderr?.trim() || "unknown error"}`,
    );
  }

  return stdout.trim();
}

async function loadApiCreateServer() {
  const installDir = getInstallDir();
  const builtApiPath = path.join(installDir, "api.js");

  if (existsSync(builtApiPath)) {
    return import(pathToFileURL(builtApiPath).href);
  }

  const sourceApiPath = new URL("../../api/src/index.ts", import.meta.url);
  return import(sourceApiPath.href);
}

program
  .name("diffview")
  .description("A better way to visualize diffs")
  .version("0.0.1")
  .action(async () => {
    const repoRoot = await resolveRepoRoot(process.cwd());
    const webRoot = resolveWebRoot();
    const { handleApiRequest } = await loadApiCreateServer();

    process.chdir(repoRoot);

    console.log(chalk.bgMagenta("starting app layer"));
    const app = startAppServer(handleApiRequest, webRoot, 0);
    const baseUrl = `http://localhost:${app.port}`;

    console.log(chalk.bgMagenta("waiting for services"));
    await waitForServer(`${baseUrl}/session`);

    console.log(chalk.bgMagenta(`opening web view at ${baseUrl}`));
    Bun.spawn(["open", baseUrl], {
      stdin: "ignore",
      stdout: "ignore",
      stderr: "ignore",
    });

    process.on("SIGINT", () => {
      app.stop();
      process.exit(0);
    });
  });

program.parse();
