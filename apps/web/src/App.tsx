import { useEffect, useState } from "react";

import type { SessionInfo } from "@diffview/shared";

const API_BASE = import.meta.env.DEV ? "http://localhost:3000" : "";

function App() {
  const [session, setSession] = useState<SessionInfo | null>(null);

  useEffect(() => {
    fetch(`${API_BASE}/session`)
      .then((res) => res.json())
      .then((data) => setSession(data));
    // fetch("/refs");
    // await fetch("/diff", {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify({ mode, base, head }),
    // });
  }, []);

  return (
    <div className="w-full h-full flex justify-center items-center">
      <pre>{session?.repo.path || ""}</pre>
    </div>
  );
}

export default App;
