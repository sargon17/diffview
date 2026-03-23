import { useEffect, useState } from "react";

import type { RefsResponse } from "@diffview/shared";
import { fetchData } from "@utils/http";

export function useRefs() {
  const [refs, setRefs] = useState<RefsResponse | null>(null);

  useEffect(() => {
    const load = async () => {
      const response = await fetchData<RefsResponse>("/refs");
      if (!response.ok) return;
      setRefs(response.data);
    };
    load();
  }, []);

  return refs;
}
