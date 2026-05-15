import type { AgentAction, FlappyBotsObservation } from './types';

// Local-only baseline policy for development smoke tests.
// Production agents should use the MoltStation API/WebSocket flow instead.
export function baselineAgentPolicy(obs: FlappyBotsObservation): AgentAction {
  if (obs.botY > obs.nextGapCenterY + 12 || obs.botVelocityY > 260) {
    return 'FLAP';
  }
  return 'NOOP';
}
