import { DiffFile } from "@diffview/shared";

function getDiffStatus(statusCode: string): DiffFile["status"] {
  if (statusCode === "A" || statusCode === "??") return "added";
  if (statusCode === "M") return "modified";
  if (statusCode === "D") return "deleted";
  if (statusCode.startsWith("R")) return "renamed";
  return "modified";
}

export function parseDiffFiles(rawList: string[]): DiffFile[] {
  return rawList.map((line) => {
    const parts = line.split("\t");
    const status = getDiffStatus(parts[0]);

    if (parts.length === 3) {
      return {
        path: parts[2],
        oldPath: parts[1],
        status,
      };
    }

    if (parts.length === 2) {
      return {
        path: parts[1],
        status,
      };
    }

    return {
      path: parts[0],
      status,
    };
  });
}
