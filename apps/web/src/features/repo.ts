const API_BASE = 'http://localhost:3000';

export async function getSession(): Promise<import('@diffview/shared').SessionInfo> {
  const res = await fetch(`${API_BASE}/session`);
  if (!res.ok) throw new Error('Failed to get session');
  return res.json();
}

export async function getRefs(): Promise<import('@diffview/shared').RefsResponse> {
  const res = await fetch(`${API_BASE}/refs`);
  if (!res.ok) throw new Error('Failed to get refs');
  return res.json();
}

export async function getDiff(
  mode: import('@diffview/shared').DiffMode,
  base?: string,
  head?: string
): Promise<import('@diffview/shared').DiffResult> {
  const res = await fetch(`${API_BASE}/diff`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mode, base, head })
  });
  if (!res.ok) throw new Error('Failed to get diff');
  return res.json();
}
