import { createContext, useContext } from "react";

import { useBaseBranch } from "./useBaseBranch";
import { useDiff } from "./useDiff";
import { useDiffMode } from "./useDiffMode";
import { useRefs } from "./useRefs";
import { useSession } from "./useSession";

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

  const repoBranches = refs?.branches.map((branch) => branch.name).filter((branch) => !branch.includes("->")) ?? [];

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
