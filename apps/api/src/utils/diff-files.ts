import { ChangedFile } from "@diffview/shared";

export function parseDiffFiles(rawList: string[]): ChangedFile[] {
  return rawList.map((line) => {
    const parts = line.split("\t");
    const statusCode = parts[0];
    const status =
      statusCode === "A" || statusCode === "??"
        ? "added"
        : statusCode === "M"
          ? "modified"
          : statusCode === "D"
            ? "deleted"
            : statusCode.startsWith("R")
              ? "renamed"
              : "modified";

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
