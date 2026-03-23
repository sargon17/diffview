import type { SessionInfo, DiffResult } from "@diffview/shared";
import { fetchData } from "@utils/http";
import { useEffect, useState } from "react";

import {Virtualizer} from "@pierre/diffs/react"


import Patch from "./components/Patch";
import Header from "./components/Header";
import { useDiffModeStore } from "./store/diff-mode.store";



function App() {
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [diff, setDiff] = useState<DiffResult | null>(null);

  const diffMode = useDiffModeStore((state) => state.current)

  const loadSession = async () => {

      const response = await fetchData<SessionInfo>(`/session`);

      if (!response.ok) return
      setSession(response.data);
  };

  const loadDiff = async () => {
      const response = await fetchData<DiffResult>(`/diff`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mode: diffMode,
        }),
      });

      if (!response.ok) return

      setDiff(response.data);
  };

  useEffect(() => {
    loadSession();
  });


  useEffect(() => {
    loadDiff();
  });

  return (
    <div className="w-full h-full min-h-screen dark:bg-neutral-900 dark:text-neutral-100">
      <Header />
      <p>{session?.currentBranch}</p>
      <Virtualizer className="w-full">
        {diff?.files.map((file) => {
          if (!file.patch) {
            return null;
          }

          return <Patch key={file.path} patch={file.patch} file={file.path} />;
        })}
      </Virtualizer>
    </div>
  );
}

export default App;
