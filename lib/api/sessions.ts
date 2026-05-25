export type RuntimeTokenMode = 'play' | 'spectate';

export function buildSessionWsUrl({
  wsBase,
  slug,
  mode,
  sessionId,
}: {
  wsBase: string;
  slug: string;
  mode: RuntimeTokenMode;
  sessionId: string;
  token?: string;
}) {
  const url = new URL(`/ws/${encodeURIComponent(slug)}/${mode}`, wsBase);
  url.searchParams.set('sessionId', sessionId);
  return url.toString();
}

export function buildSessionWsProtocols(token: string) {
  return ['molt-v1', `molt-token.${token}`];
}
