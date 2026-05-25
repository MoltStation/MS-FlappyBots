import {
  BOT_RADIUS,
  BOT_X,
  DESIGN_HEIGHT,
  DESIGN_WIDTH,
  FLOOR_Y,
  GROUND_HEIGHT,
  OBSTACLE_WIDTH,
  SCROLL_SPEED,
} from './constants';
import type { FlappyFrame } from './types';

type PhaserLike = any;

const ASSET_KEYS = {
  background: 'flappybots-background',
  bot: 'flappybots-bot',
  gate: 'flappybots-gate',
  ground: 'flappybots-ground',
};

const ASSET_PATHS = {
  background: '/assets/flappybots/generated/background.png',
  bot: '/assets/flappybots/generated/bot.png',
  gate: '/assets/flappybots/generated/obstacle-gate.png',
  ground: '/assets/flappybots/generated/ground.png',
};

const GATE_DISPLAY_WIDTH = 178;
const GATE_DISPLAY_HEIGHT = 268;
const GATE_TOP_CENTER_OFFSET = -215;
const GATE_BOTTOM_CENTER_OFFSET = 215;
const GROUND_TILE_WIDTH = 768;
const GROUND_TILE_HEIGHT = 256;
const GROUND_TILE_Y = FLOOR_Y - 99;

function drawGateBody(scene: any, obstacle: FlappyFrame['obstacles'][number]) {
  const gate = scene.add.container(obstacle.x, 0);
  const x = -OBSTACLE_WIDTH * 0.5;

  if (scene.textures.exists(ASSET_KEYS.gate)) {
    const top = scene.add.image(0, obstacle.gapCenterY + GATE_TOP_CENTER_OFFSET, ASSET_KEYS.gate);
    top.setOrigin(0.5, 0.5);
    top.setRotation(Math.PI);
    top.setDisplaySize(GATE_DISPLAY_WIDTH, GATE_DISPLAY_HEIGHT);

    const bottom = scene.add.image(0, obstacle.gapCenterY + GATE_BOTTOM_CENTER_OFFSET, ASSET_KEYS.gate);
    bottom.setOrigin(0.5, 0.5);
    bottom.setDisplaySize(GATE_DISPLAY_WIDTH, GATE_DISPLAY_HEIGHT);

    gate.add([top, bottom]);
  } else {
    const topHeight = Math.max(0, obstacle.gapTopY);
    const bottomY = obstacle.gapBottomY;
    const bottomHeight = Math.max(0, FLOOR_Y - bottomY);
    const graphics = scene.add.graphics();
    graphics.fillStyle(0x16253b, 0.96);
    graphics.fillRoundedRect(x, 0, OBSTACLE_WIDTH, topHeight, 10);
    graphics.fillRoundedRect(x, bottomY, OBSTACLE_WIDTH, bottomHeight, 10);
    graphics.lineStyle(4, 0x45f0ff, 0.88);
    graphics.strokeRoundedRect(x + 2, 2, OBSTACLE_WIDTH - 4, Math.max(0, topHeight - 4), 8);
    graphics.strokeRoundedRect(x + 2, bottomY + 2, OBSTACLE_WIDTH - 4, Math.max(0, bottomHeight - 4), 8);
    gate.add(graphics);
  }
  gate.setDepth(8);
  return gate;
}

function drawGate(scene: any, obstacle: FlappyFrame['obstacles'][number]) {
  return drawGateBody(scene, obstacle);
}

export function createFlappyBotsPhaserGame({
  Phaser,
  parent,
  getFrame,
}: {
  Phaser: PhaserLike;
  parent: HTMLElement;
  getFrame: () => FlappyFrame | null;
}) {
  const scene = new Phaser.Scene('flappybots-render');
  const objects: {
    bot?: any;
    gates: Map<string, any>;
    stars: any[];
    bg?: any;
    grid?: any;
    ground?: any;
    groundTiles: any[];
  } = { gates: new Map(), groundTiles: [], stars: [] };

  scene.preload = function preload() {
    this.load.image(ASSET_KEYS.background, ASSET_PATHS.background);
    this.load.image(ASSET_KEYS.bot, ASSET_PATHS.bot);
    this.load.image(ASSET_KEYS.gate, ASSET_PATHS.gate);
    this.load.image(ASSET_KEYS.ground, ASSET_PATHS.ground);
  };

  scene.create = function create() {
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x07111f, 0x07111f, 0x103b59, 0x102037, 1);
    bg.fillRect(0, 0, DESIGN_WIDTH, DESIGN_HEIGHT);
    bg.setDepth(-40);
    objects.bg = bg;

    if (this.textures.exists(ASSET_KEYS.background)) {
      const background = this.add.image(DESIGN_WIDTH * 0.5, FLOOR_Y * 0.5, ASSET_KEYS.background);
      background.setDisplaySize(DESIGN_WIDTH, FLOOR_Y);
      background.setDepth(-39);
    }

    const stars = [];
    for (let i = 0; i < 52; i += 1) {
      const star = this.add.circle(
        Math.random() * DESIGN_WIDTH,
        Math.random() * (FLOOR_Y - 40),
        1 + Math.random() * 1.8,
        0x8ff7ff,
        0.22 + Math.random() * 0.38
      );
      star.setDepth(-30);
      stars.push(star);
    }
    objects.stars = stars;

    const grid = this.add.graphics();
    grid.lineStyle(1, 0x45f0ff, 0.12);
    for (let y = 44; y < FLOOR_Y; y += 44) grid.lineBetween(0, y, DESIGN_WIDTH, y);
    for (let x = 0; x < DESIGN_WIDTH; x += 64) grid.lineBetween(x, 0, x, FLOOR_Y);
    grid.setDepth(-20);
    objects.grid = grid;

    if (this.textures.exists(ASSET_KEYS.ground)) {
      for (let index = 0; index < 3; index += 1) {
        const ground = this.add.image(index * GROUND_TILE_WIDTH, GROUND_TILE_Y, ASSET_KEYS.ground);
        ground.setOrigin(0, 0);
        ground.setDisplaySize(GROUND_TILE_WIDTH, GROUND_TILE_HEIGHT);
        ground.setDepth(18);
        objects.groundTiles.push(ground);
      }
    } else {
      const ground = this.add.graphics();
      ground.fillStyle(0x0d1728, 1);
      ground.fillRect(0, FLOOR_Y, DESIGN_WIDTH, GROUND_HEIGHT);
      ground.lineStyle(3, 0x45f0ff, 0.45);
      ground.lineBetween(0, FLOOR_Y, DESIGN_WIDTH, FLOOR_Y);
      ground.lineStyle(1, 0xffcf5f, 0.28);
      for (let x = -40; x < DESIGN_WIDTH + 80; x += 52) {
        ground.lineBetween(x, FLOOR_Y + GROUND_HEIGHT, x + 34, FLOOR_Y + 6);
      }
      ground.setDepth(18);
      objects.ground = ground;
    }

    const bot = this.add.container(BOT_X, DESIGN_HEIGHT * 0.46);
    const glow = this.add.circle(0, 0, BOT_RADIUS + 10, 0x45f0ff, 0.16);
    if (this.textures.exists(ASSET_KEYS.bot)) {
      const sprite = this.add.image(0, 0, ASSET_KEYS.bot);
      sprite.setDisplaySize(BOT_RADIUS * 4.4, BOT_RADIUS * 4.4);
      bot.add([glow, sprite]);
    } else {
      const body = this.add.ellipse(0, 0, BOT_RADIUS * 2.15, BOT_RADIUS * 1.55, 0xd8fbff, 1);
      const core = this.add.circle(3, 0, 5, 0x164766, 1);
      const wingTop = this.add.triangle(-15, -12, 0, 0, -22, -5, -8, -14, 0x45f0ff, 0.88);
      const wingBot = this.add.triangle(-15, 12, 0, 0, -22, 5, -8, 14, 0xffcf5f, 0.88);
      const nose = this.add.triangle(18, 0, 0, -7, 0, 7, 13, 0, 0xff5f8f, 1);
      bot.add([glow, wingTop, wingBot, body, core, nose]);
    }
    bot.setDepth(20);
    bot.setVisible(false);
    objects.bot = bot;
  };

  scene.update = function update() {
    const frame = getFrame();
    if (!frame) return;
    if (objects.bot) {
      objects.bot.setPosition(frame.bot?.x ?? BOT_X, frame.bot?.y ?? DESIGN_HEIGHT * 0.46);
      objects.bot.setRotation(frame.bot?.rotation ?? 0);
      objects.bot.setAlpha(frame.phase === 'ended' ? 0.62 : 1);
    }

    const nextIds = new Set<string>();
    for (const obstacle of Array.isArray(frame.obstacles) ? frame.obstacles : []) {
      nextIds.add(obstacle.id);
      let gate = objects.gates.get(obstacle.id);
      if (!gate) {
        gate = drawGate(this, obstacle);
        objects.gates.set(obstacle.id, gate);
      } else {
        gate.destroy();
        gate = drawGate(this, obstacle);
        objects.gates.set(obstacle.id, gate);
      }
    }
    for (const [id, gate] of objects.gates.entries()) {
      if (nextIds.has(id)) continue;
      gate.destroy();
      objects.gates.delete(id);
    }

    const scroll = Number(frame.tMs || 0) * 0.02;
    for (const [idx, star] of objects.stars.entries()) {
      const speed = 0.18 + (idx % 5) * 0.05;
      const nextX = (star.x - speed + DESIGN_WIDTH) % DESIGN_WIDTH;
      star.setPosition(nextX, star.y + Math.sin(scroll + idx) * 0.006);
    }

    if (objects.groundTiles.length > 0) {
      const groundOffset = -(((Number(frame.tMs || 0) / 1000) * SCROLL_SPEED) % GROUND_TILE_WIDTH);
      objects.groundTiles.forEach((ground, index) => {
        ground.setPosition(groundOffset + index * GROUND_TILE_WIDTH, GROUND_TILE_Y);
      });
    }
  };

  return new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: DESIGN_WIDTH,
    height: DESIGN_HEIGHT,
    backgroundColor: '#07111f',
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    audio: { noAudio: true },
    scene,
  });
}
