const API_BASE = "";

type Result<T> = { ok: true; data: T } | { ok: false; error: string };

export const fetchData = async <T extends object>(
  path: string,
  options?: RequestInit,
): Promise<Result<T>> => {
  const data = await fetch(`${API_BASE}${path}`, options);

  if (!data.ok) {
    return { ok: false, error: `Something went wrong during fetching ${path}` };
  }

  const parsed: T = await data.json();

  return { ok: true, data: parsed };
};
