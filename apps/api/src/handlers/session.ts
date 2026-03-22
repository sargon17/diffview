import { SessionInfo, DiffMode } from "@diffview/shared";

import { getRepoRoot, getCurrentBranch, getBranches } from "@/utils/git";
import { json } from "@/utils/http";

export default async function handleSession(): Promise<Response> {
  try {
    const repoRoot = await getRepoRoot();
    const currentBranch = await getCurrentBranch();
    const branches = await getBranches();
    const mainCandidates = ["main", "master", "develop"];
    const defaultBase =
      branches.find((b) => !b.isRemote && mainCandidates.includes(b.name))?.name ||
      branches.find((b) => !b.isRemote)?.name ||
      currentBranch;

    const session: SessionInfo = {
      repo: {
        path: repoRoot,
        name: repoRoot.split("/").pop() || "unknown",
      },
      currentBranch,
      defaultBaseRef: defaultBase,
      mode: "branch" as DiffMode,
    };
    return json(session);
  } catch (err) {
    return json({ error: err }, 500);
  }
}
