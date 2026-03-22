import type { SessionInfo, DiffResult } from "@diffview/shared";
import { fetchData } from "@utils/http";
import { useEffect, useState } from "react";


import Patch from "./components/Patch";
import Header from "./components/Header";

function App() {
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [diff, setDiff] = useState<DiffResult | null>(null);

  const loadSession = async () => {
    try {
      const data = await fetchData<SessionInfo>(`/session`);
      setSession(data);
    } catch {
      console.error("error");
    }
  };

  const loadDiff = async () => {
    try {
      const data = await fetchData<DiffResult>(`/diff`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mode: "working",
        }),
      });

      setDiff(data);
    } catch {
      console.error("error");
    }
  };

  useEffect(() => {
    loadSession();
  }, []);


  useEffect(() => {
    loadDiff();
  }, []);

  return (
    <div className="w-full h-full min-h-screen dark:bg-neutral-900 dark:text-neutral-100">
      <Header />
      <p>{session?.currentBranch}</p>
      <div className="w-full">
        {diff?.files.map((file) => {
          if (!file.patch) {
            return null;
          }

          return <Patch key={file.path} patch={file.patch} file={file.path} />;
        })}
      </div>
    </div>
  );
}

export default App;
