import {
  BOT_RADIUS,
  BOT_X,
  CEILING_Y,
  DEFAULT_SEED,
  DESIGN_HEIGHT,
  DESIGN_WIDTH,
  FLAP_VELOCITY,
  FLOOR_Y,
  GAP_HEIGHT,
  GAP_MARGIN,
  GRAVITY,
  MAX_FALL_SPEED,
  OBSTACLE_SPACING,
  OBSTACLE_START_X,
  OBSTACLE_WIDTH,
  SCORE_BASE_FPS,
  SCROLL_SPEED,
} from './constants';
import { hashSeed, mulberry32, randRange } from './rng';
import type {
  AgentAction,
  FlappyBotsAdapter,
  FlappyBotsObservation,
  FlappyFrame,
  FlappyObstacle,
  GameOverReason,
} from './types';

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function normalizeAction(action: AgentAction): AgentAction {
  return action === 'FLAP' ? 'FLAP' : 'NOOP';
}

export class FlappyBotsEngine implements FlappyBotsAdapter {
  private rng = mulberry32(hashSeed(DEFAULT_SEED));
  private seed = DEFAULT_SEED;
  private tMs = 0;
  private tick = 0;
  private botY = DESIGN_HEIGHT * 0.46;
  private botVelocityY = 0;
  private score = 0;
  private highScore = 0;
  private alive = true;
  private nextObstacleId = 1;
  private latestAction: AgentAction = 'NOOP';
  private gameOverReason: GameOverReason | undefined;
  private obstacles: FlappyObstacle[] = [];
  private events: FlappyFrame['events'] = [];

  constructor(seed = DEFAULT_SEED) {
    this.resetSession(seed);
  }

  resetSession(seed = DEFAULT_SEED) {
    this.seed = String(seed || DEFAULT_SEED);
    this.rng = mulberry32(hashSeed(this.seed));
    this.tMs = 0;
    this.tick = 0;
    this.botY = DESIGN_HEIGHT * 0.46;
    this.botVelocityY = 0;
    this.score = 0;
    this.highScore = 0;
    this.alive = true;
    this.gameOverReason = undefined;
    this.nextObstacleId = 1;
    this.latestAction = 'NOOP';
    this.events = [{ t: 'reset' }];
    this.obstacles = [];
    this.spawnInitialObstacles();
  }

  getSeed() {
    return this.seed;
  }

  getObservation(): FlappyBotsObservation {
    const next = this.getNextObstacle();
    return {
      tick: this.tick,
      botY: Math.round(this.botY * 1000) / 1000,
      botVelocityY: Math.round(this.botVelocityY * 1000) / 1000,
      nextObstacleX: Math.round((next?.x ?? DESIGN_WIDTH) * 1000) / 1000,
      nextGapCenterY: Math.round((next?.gapCenterY ?? DESIGN_HEIGHT * 0.5) * 1000) / 1000,
      nextGapTopY: Math.round((next?.gapTopY ?? 0) * 1000) / 1000,
      nextGapBottomY: Math.round((next?.gapBottomY ?? FLOOR_Y) * 1000) / 1000,
      distanceToNextObstacle: Math.round(Math.max(0, (next?.x ?? BOT_X) - BOT_X) * 1000) / 1000,
      score: Math.floor(this.score),
      alive: this.alive,
    };
  }

  applyAction(action: AgentAction) {
    const normalized = normalizeAction(action);
    this.latestAction = normalized;
    if (!this.alive) return;
    if (normalized === 'FLAP') {
      this.botVelocityY = FLAP_VELOCITY;
      this.events.push({ t: 'flap' });
    }
  }

  step(dtMs: number) {
    this.events = [];
    if (!this.alive) return this.getFrame();

    const dt = Math.max(0, Math.min(100, dtMs)) / 1000;
    this.tMs += dtMs;
    this.tick += 1;

    this.botVelocityY = clamp(this.botVelocityY + GRAVITY * dt, -999, MAX_FALL_SPEED);
    this.botY += this.botVelocityY * dt;

    for (const obstacle of this.obstacles) {
      obstacle.x -= SCROLL_SPEED * dt;
      if (!obstacle.passed && obstacle.x + OBSTACLE_WIDTH * 0.5 < BOT_X - BOT_RADIUS) {
        obstacle.passed = true;
        this.events.push({ t: 'gate_passed', score: Math.floor(this.score), gateId: obstacle.id });
      }
    }

    this.obstacles = this.obstacles.filter((obstacle) => obstacle.x > -OBSTACLE_WIDTH);
    this.ensureObstacleBuffer();

    const invalidReason = this.getInvalidStateReason();
    if (invalidReason) {
      this.endRun(invalidReason);
    }

    const boundsReason = this.getBoundsCollisionReason();
    if (boundsReason) {
      this.endRun(boundsReason);
    }

    const obstacle = this.getObstacleCollision();
    if (obstacle) {
      this.endRun('OBSTACLE_COLLISION', { obstacleId: obstacle.id });
    }

    if (this.alive) {
      this.score += (SCROLL_SPEED / 1000) * SCORE_BASE_FPS * dt;
      this.highScore = Math.max(this.highScore, Math.floor(this.score));
    }

    return this.getFrame();
  }

  isGameOver() {
    return !this.alive;
  }

  getScore() {
    return Math.floor(this.score);
  }

  getFrame(): FlappyFrame {
    const rotation = clamp(this.botVelocityY / 640, -0.55, 0.9);
    return {
      v: 1,
      tick: this.tick,
      tMs: this.tMs,
      phase: this.alive ? (this.tick === 0 ? 'ready' : 'running') : 'ended',
      bot: {
        x: BOT_X,
        y: this.botY,
        velocityY: this.botVelocityY,
        rotation,
      },
      score: {
        current: Math.floor(this.score),
        high: Math.floor(this.highScore),
      },
      latestAction: this.latestAction,
      gameOverReason: this.gameOverReason,
      observation: this.getObservation(),
      obstacles: this.obstacles.map((obstacle) => ({ ...obstacle })),
      events: this.events,
    };
  }

  private spawnInitialObstacles() {
    for (let i = 0; i < 5; i += 1) {
      this.spawnObstacle(OBSTACLE_START_X + i * OBSTACLE_SPACING);
    }
  }

  private ensureObstacleBuffer() {
    let lastX = this.obstacles.reduce((max, obstacle) => Math.max(max, obstacle.x), -Infinity);
    if (!Number.isFinite(lastX)) lastX = OBSTACLE_START_X - OBSTACLE_SPACING;
    while (lastX < DESIGN_WIDTH + OBSTACLE_SPACING * 2) {
      lastX += OBSTACLE_SPACING;
      this.spawnObstacle(lastX);
    }
  }

  private spawnObstacle(x: number) {
    const center = randRange(this.rng, GAP_MARGIN + GAP_HEIGHT * 0.5, FLOOR_Y - GAP_MARGIN - GAP_HEIGHT * 0.5);
    this.obstacles.push({
      id: `gate-${this.nextObstacleId++}`,
      x,
      gapCenterY: center,
      gapTopY: center - GAP_HEIGHT * 0.5,
      gapBottomY: center + GAP_HEIGHT * 0.5,
      passed: false,
    });
  }

  private getNextObstacle() {
    return (
      this.obstacles
        .filter((obstacle) => obstacle.x + OBSTACLE_WIDTH * 0.5 >= BOT_X - BOT_RADIUS)
        .sort((a, b) => a.x - b.x)[0] ?? null
    );
  }

  private endRun(reason: GameOverReason, debug: Record<string, string | number | boolean> = {}) {
    if (!this.alive) return;
    this.alive = false;
    this.gameOverReason = reason;
    this.events.push({ t: 'game_over', score: Math.floor(this.score), reason, ...debug });
  }

  private getInvalidStateReason(): GameOverReason | undefined {
    if (!Number.isFinite(this.botY)) return 'INVALID_POSITION';
    if (!Number.isFinite(this.botVelocityY)) return 'INVALID_VELOCITY';
    return undefined;
  }

  private getBoundsCollisionReason(): GameOverReason | undefined {
    if (this.botY - BOT_RADIUS <= CEILING_Y) return 'CEILING_COLLISION';
    if (this.botY + BOT_RADIUS >= FLOOR_Y) return 'GROUND_COLLISION';
    return undefined;
  }

  private getObstacleCollision() {
    for (const obstacle of this.obstacles) {
      const inX =
        BOT_X + BOT_RADIUS > obstacle.x - OBSTACLE_WIDTH * 0.5 &&
        BOT_X - BOT_RADIUS < obstacle.x + OBSTACLE_WIDTH * 0.5;
      if (!inX) continue;
      const inGap =
        this.botY - BOT_RADIUS > obstacle.gapTopY && this.botY + BOT_RADIUS < obstacle.gapBottomY;
      if (!inGap) return obstacle;
    }
    return null;
  }
}
