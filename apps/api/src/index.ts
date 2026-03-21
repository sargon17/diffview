import { SessionInfo, BranchRef, DiffMode, DiffFile } from "@diffview/shared";
import handleDiff from "./handlers/diff";
import handleRefs from "./handlers/refs";
import handleSession from "./handlers/session";

// TODO: think that should be fixed, like wtf
// Re-export types for CLI
export type { SessionInfo, BranchRef, DiffMode, DiffFile };

// TODO: find a nicer way to handle the routes
export async function handleApiRequest(req: Request): Promise<Response> {
  const url = new URL(req.url);
  if (url.pathname === "/session" && req.method === "GET") {
    return handleSession();
  }
  if (url.pathname === "/refs" && req.method === "GET") {
    return handleRefs();
  }
  if (url.pathname === "/diff" && req.method === "POST") {
    return handleDiff(req);
  }
  return new Response("Not Found", { status: 404 });
}

// --- Server factory ---
export function createServer(port = 3000) {
  return Bun.serve({
    port,
    fetch: handleApiRequest,
  });
}

// If run directly, start server
if (import.meta.url === `file://${process.argv[1]}`) {
  createServer(3000);
  console.log(`Diffview API running on http://localhost:3000`);
}
