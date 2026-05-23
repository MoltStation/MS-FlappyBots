export type AgentAction = 'FLAP' | 'NOOP';

export type GameMode = 'AI_MODE' | 'TEST_MODE' | 'SPECTATE_MODE';

export type GameOverReason =
  | 'GROUND_COLLISION'
  | 'CEILING_COLLISION'
  | 'OBSTACLE_COLLISION'
  | 'INVALID_POSITION'
  | 'INVALID_VELOCITY'
  | 'SESSION_ENDED'
  | 'INPUT_BUBBLE_RESTART'
  | 'UNKNOWN';

export type FlappyBotsObservation = {
  tick: number;
  botY: number;
  botVelocityY: number;
  nextObstacleX: number;
  nextGapCenterY: number;
  nextGapTopY: number;
  nextGapBottomY: number;
  distanceToNextObstacle: number;
  score: number;
  alive: boolean;
};

export type FlappyObstacle = {
  id: string;
  x: number;
  gapCenterY: number;
  gapTopY: number;
  gapBottomY: number;
  passed: boolean;
};

export type FlappyFrame = {
  v: 1;
  slug?: string;
  sessionId?: string;
  tick: number;
  tMs: number;
  phase: 'ready' | 'running' | 'ended';
  bot: {
    x: number;
    y: number;
    velocityY: number;
    rotation: number;
  };
  score: {
    current: number;
    high: number;
  };
  latestAction: AgentAction;
  gameOverReason?: GameOverReason;
  observation: FlappyBotsObservation;
  obstacles: FlappyObstacle[];
  events: Array<{ t: string; [key: string]: string | number | boolean }>;
};

export type FlappyBotsAdapter = {
  getObservation(): FlappyBotsObservation;
  applyAction(action: AgentAction): void;
  resetSession(seed?: string): void;
  isGameOver(): boolean;
  getScore(): number;
};
