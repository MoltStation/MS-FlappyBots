import { execFileSync } from 'node:child_process';
import { rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const outDir = join(tmpdir(), 'flappybots-engine-check');
const tscBin = join(process.cwd(), 'node_modules', 'typescript', 'bin', 'tsc');

rmSync(outDir, { recursive: true, force: true });
execFileSync(
  process.execPath,
  [
    tscBin,
    'lib/game/FlappyBotsEngine.ts',
    'lib/game/constants.ts',
    'lib/game/rng.ts',
    'lib/game/types.ts',
    '--module',
    'commonjs',
    '--target',
    'es2020',
    '--outDir',
    outDir,
    '--skipLibCheck',
  ],
  { stdio: 'inherit' }
);

const testFile = join(outDir, 'check.cjs');
writeFileSync(
  testFile,
  `
const { FlappyBotsEngine } = require('./FlappyBotsEngine.js');

const engine = new FlappyBotsEngine('regression-first-flap');
const ready = engine.getFrame();
if (ready.phase !== 'ready' || !ready.observation.alive) {
  throw new Error('Expected ready alive frame before input.');
}

engine.applyAction('FLAP');
const afterAction = engine.getFrame();
if (afterAction.phase !== 'ready' || !afterAction.observation.alive) {
  throw new Error('FLAP action should not end the run before physics advances.');
}

for (let i = 0; i < 10; i += 1) {
  const frame = engine.step(50);
  if (frame.phase === 'ended') {
    throw new Error('First flap ended within the first 500ms; expected continued flight.');
  }
}

const browserLike = new FlappyBotsEngine('browser-like-first-input');
browserLike.applyAction('FLAP');
for (let i = 0; i < 60; i += 1) {
  const frame = browserLike.step(1000 / 60);
  if (frame.phase === 'ended') {
    throw new Error(
      'Browser-like first flap ended within the first second: ' +
        JSON.stringify({
          reason: frame.gameOverReason,
          tick: frame.tick,
          botY: frame.bot.y,
          botVelocityY: frame.bot.velocityY,
          nextObstacleX: frame.observation.nextObstacleX,
          nextGapTopY: frame.observation.nextGapTopY,
          nextGapBottomY: frame.observation.nextGapBottomY,
          events: frame.events,
        })
    );
  }
}

const scoringPilot = new FlappyBotsEngine('score-reaches-first-gate');
scoringPilot.applyAction('FLAP');
let scored = false;
let finalFrame = scoringPilot.getFrame();
for (let i = 0; i < 240; i += 1) {
  const frame = scoringPilot.getFrame();
  const observation = frame.observation;
  const targetY =
    observation.distanceToNextObstacle < 500 ? observation.nextGapCenterY + 60 : 250;
  if (
    observation.alive &&
    (observation.botY > targetY ||
      (observation.botVelocityY > 120 && observation.botY > targetY - 70))
  ) {
    scoringPilot.applyAction('FLAP');
  }
  finalFrame = scoringPilot.step(1000 / 60);
  if (finalFrame.score.current >= 1) {
    scored = true;
    break;
  }
  if (finalFrame.phase === 'ended') break;
}
if (!scored) {
  throw new Error(
    'Expected a controlled practice run to accumulate Shell-style distance score: ' +
      JSON.stringify({
        reason: finalFrame.gameOverReason,
        tick: finalFrame.tick,
        botY: finalFrame.bot.y,
        botVelocityY: finalFrame.bot.velocityY,
        nextObstacleX: finalFrame.observation.nextObstacleX,
        nextGapTopY: finalFrame.observation.nextGapTopY,
        nextGapBottomY: finalFrame.observation.nextGapBottomY,
        score: finalFrame.score.current,
        events: finalFrame.events,
      })
  );
}

console.log('[check-flappy-engine] first flap and browser-like input regressions OK');
`
);

execFileSync('node', [testFile], { stdio: 'inherit' });
