import { useCookieState } from "./useCookieState";

export function useBaseBranch(repoKey: string, defaultBaseRef: string) {
  const cookieKey = repoKey ? `base-branch:${repoKey}` : "";
  return useCookieState(cookieKey, defaultBaseRef, { enabled: !!cookieKey });
}
