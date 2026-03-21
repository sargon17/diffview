import { getDiffFiles, parseDiffFiles, getDiffPatches, splitPatchByFile } from "@/utils/git";
import { DiffFile, DiffMode } from "@diffview/shared";
import { json } from "@utils/http";

export default async function handleDiff(request: Request): Promise<Response> {
  try {
    const body: { mode: DiffMode; base?: string; head?: string } = await request.json();
    const { mode, base, head } = body;

    if (mode === "branch" && (!base || !head)) {
      return json({ error: "base and head required for branch mode" }, 400);
    }

    const filesRaw = await getDiffFiles(mode, base, head);
    const files = parseDiffFiles(filesRaw);

    if (files.length === 0) {
      return json({ mode, files: [] });
    }

    const fullPatch = await getDiffPatches(mode, base, head);
    const filePatches = splitPatchByFile(fullPatch);

    const enrichedFiles: DiffFile[] = files.map((f) => ({
      ...f,
      patch: filePatches.get(f.path) || "",
    }));

    return json({ mode, files: enrichedFiles });
  } catch (err) {
    return json({ error: err }, 500);
  }
}
