import { buildSessionWsUrl } from '../api/sessions';
import { GAME_SLUG } from '../game/constants';

export function buildRuntimeSocketUrl({
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
  return buildSessionWsUrl({ wsBase, slug, mode: 'play', sessionId, token });
}
