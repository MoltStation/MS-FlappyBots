import { buildSessionWsProtocols, buildSessionWsUrl } from '../api/sessions';
import { GAME_SLUG } from '../game/constants';

export function buildSpectateSocketUrl({
  wsBase,
  sessionId,
  token,
  slug = GAME_SLUG,
}: {
  wsBase: string;
  sessionId: string;
  token: string;
  slug?: string;
}) {
  return buildSessionWsUrl({ wsBase, slug, mode: 'spectate', sessionId, token });
}

export function buildSpectateSocketProtocols(token: string) {
  return buildSessionWsProtocols(token);
}
