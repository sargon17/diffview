const API_BASE = "";

export const fetchData = async <T>(path: string, options?: RequestInit) => {
  const data = await fetch(`${API_BASE}${path}`, options);

  const parsed: T = await data.json();

  return parsed;
};
