export type RuntimeTokenMode = 'play' | 'spectate';

export function buildSessionWsUrl({
  wsBase,
  slug,
  mode,
  sessionId,
  token,
}: {
  wsBase: string;
  slug: string;
  mode: RuntimeTokenMode;
  sessionId: string;
  token: string;
}) {
  const url = new URL(`/ws/${encodeURIComponent(slug)}/${mode}`, wsBase);
  url.searchParams.set('sessionId', sessionId);
  url.searchParams.set('token', token);
  return url.toString();
}
