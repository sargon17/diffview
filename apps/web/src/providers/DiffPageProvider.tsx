import { createContext, useContext } from "react";

import { useBaseBranch } from "../hooks/useBaseBranch";
import { useDiff } from "../hooks/useDiff";
import { useDiffMode } from "../hooks/useDiffMode";
import { useRefs } from "../hooks/useRefs";
import { useSession } from "../hooks/useSession";

type DiffPageState = {
  diffMode: ReturnType<typeof useDiffMode>["current"];
  setDiffMode: ReturnType<typeof useDiffMode>["update"];
  session: ReturnType<typeof useSession>;
  refs: ReturnType<typeof useRefs>;
  baseBranch: string;
  setBaseBranch: (value: string) => void;
  diff: ReturnType<typeof useDiff>;
  repoBranches: string[];
};

const DiffPageContext = createContext<DiffPageState | null>(null);

export function DiffPageProvider({ children }: { children: React.ReactNode }) {
  const { current: diffMode, update: setDiffMode } = useDiffMode();
  const session = useSession();
  const refs = useRefs();
  const [baseBranch, setBaseBranch] = useBaseBranch(session?.repo.name ?? "", session?.defaultBaseRef ?? "");
  const diff = useDiff(diffMode, session, baseBranch);

  const repoBranches = refs?.branches
    .map((branch: { name: string }) => branch.name)
    .filter((branch: string) => !branch.includes("->")) ?? [];

  return (
    <DiffPageContext.Provider
      value={{ diffMode, setDiffMode, session, refs, baseBranch, setBaseBranch, diff, repoBranches }}
    >
      {children}
    </DiffPageContext.Provider>
  );
}

export function useDiffPage() {
  const value = useContext(DiffPageContext);
  if (!value) throw new Error("useDiffPage must be used within DiffPageProvider");
  return value;
}
