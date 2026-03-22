import type { SessionInfo, DiffResult } from "@diffview/shared";
import { fetchData } from "@utils/http";
import { useEffect, useState } from "react";

import Patch from "./components/Patch";

function App() {
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [diff, setDiff] = useState<DiffResult | null>(null);
  const [collapsed, setCollapsed] = useState<boolean>(false);

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
    loadDiff();
  }, []);

  return (
    <div className="w-full h-full min-h-screen flex flex-col justify-center items-center dark:bg-neutral-900 dark:text-neutral-100">
      <p>{session?.currentBranch}</p>
      <div className="w-full" onClick={() => setCollapsed(!collapsed)}>
        {diff?.files.map((file) => {
          return <Patch patch={file.patch!} file={file.path} />;
        })}
      </div>
    </div>
  );
}

export default App;
