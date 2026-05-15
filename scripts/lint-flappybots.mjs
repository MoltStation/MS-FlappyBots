import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const required = [
  'pages/flappybots/index.tsx',
  'pages/flappybots/test.tsx',
  'pages/flappybots/spectate.tsx',
  'lib/game/FlappyBotsEngine.ts',
  'lib/game/agentPolicy.ts',
  'README.md',
  'ROADMAP.md',
];

for (const rel of required) {
  if (!fs.existsSync(path.join(root, rel))) {
    throw new Error(`[lint-flappybots] Missing required file: ${rel}`);
  }
}

const nextConfig = fs.readFileSync(path.join(root, 'next.config.js'), 'utf8');
if (nextConfig.includes('ignoreBuildErrors')) {
  throw new Error('[lint-flappybots] next.config.js must not ignore TypeScript build errors');
}

const sceneSource = fs.readFileSync(path.join(root, 'lib/game/FlappyBotsScene.ts'), 'utf8');
if (sceneSource.includes('gate.clear()')) {
  throw new Error('[lint-flappybots] Do not call clear() on gates; generated gates are Phaser containers');
}

console.log('[lint-flappybots] OK');
