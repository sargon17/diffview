import { useEffect, useRef, useState } from "react";

export function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.split("; ").find((row) => {
    const [key] = row.split("=");
    return key === name;
  });
  return match ? decodeURIComponent(match.split("=").slice(1).join("=")) : null;
}

export function setCookie(name: string, value: string, maxAgeSeconds: number) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAgeSeconds}; SameSite=Lax`;
}

export function useCookieState(
  name: string,
  initialValue: string,
  options?: { enabled?: boolean; maxAgeSeconds?: number },
) {
  const enabled = options?.enabled ?? true;
  const maxAgeSeconds = options?.maxAgeSeconds ?? 60 * 60 * 24 * 30;
  const [value, setValue] = useState(initialValue);
  const skipNextWriteRef = useRef(false);

  useEffect(() => {
    if (!enabled || !name) return;
    const cookie = getCookie(name);
    skipNextWriteRef.current = true;
    setValue(cookie ?? initialValue);
  }, [name, enabled, initialValue]);

  useEffect(() => {
    if (!enabled || !name) return;
    if (skipNextWriteRef.current) {
      skipNextWriteRef.current = false;
      return;
    }
    setCookie(name, value, maxAgeSeconds);
  }, [name, value, enabled, maxAgeSeconds]);

  return [value, setValue] as const;
}
