import { getBranches } from "@/utils/git";
import { json } from "@/utils/http";

export default async function handleRefs(): Promise<Response> {
  try {
    const branches = await getBranches();
    return json({ branches, remoteBranches: branches.filter((b) => b.isRemote) });
  } catch (err) {
    return json({ error: err }, 500);
  }
}
