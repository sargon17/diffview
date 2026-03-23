import { useEffect, useState } from "react";

import type { SessionInfo } from "@diffview/shared";
import { fetchData } from "@utils/http";

export function useSession() {
  const [session, setSession] = useState<SessionInfo | null>(null);

  useEffect(() => {
    const load = async () => {
      const response = await fetchData<SessionInfo>("/session");
      if (!response.ok) return;
      setSession(response.data);
    };
    load();
  }, []);

  return session;
}
