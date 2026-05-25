import { useEffect, useMemo, useRef, useState } from 'react';

import { createFlappyBotsPhaserGame } from '../../lib/game/FlappyBotsScene';
import { BOT_RADIUS, DESIGN_HEIGHT, DESIGN_WIDTH } from '../../lib/game/constants';
import type { FlappyFrame } from '../../lib/game/types';

function getViewportRect() {
  if (typeof window === 'undefined') return { scale: 1, x: 0, y: 0 };
  const scale = Math.min(window.innerWidth / DESIGN_WIDTH, window.innerHeight / DESIGN_HEIGHT);
  return {
    scale,
    x: (window.innerWidth - DESIGN_WIDTH * scale) * 0.5,
    y: (window.innerHeight - DESIGN_HEIGHT * scale) * 0.5,
  };
}

export default function FlappyBotsCanvas({ frame }: { frame: FlappyFrame | null }) {
  const parentRef = useRef<HTMLDivElement | null>(null);
  const gameRef = useRef<any>(null);
  const frameRef = useRef<FlappyFrame | null>(frame);
  const [viewport, setViewport] = useState(getViewportRect);

  const botStyle = useMemo(() => {
    if (!frame?.bot) return undefined;
    const size = BOT_RADIUS * 4.6 * viewport.scale;
    return {
      width: `${size}px`,
      height: `${size}px`,
      transform: `translate(${viewport.x + frame.bot.x * viewport.scale - size * 0.5}px, ${viewport.y + frame.bot.y * viewport.scale - size * 0.5}px) rotate(${frame.bot.rotation}rad)`,
      opacity: frame.phase === 'ended' ? 0.72 : 1,
    };
  }, [frame, viewport]);

  useEffect(() => {
    frameRef.current = frame;
  }, [frame]);

  useEffect(() => {
    const onResize = () => setViewport(getViewportRect());
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!parentRef.current || gameRef.current) return;
    let disposed = false;

    (async () => {
      const PhaserMod: any = await import('phaser');
      if (disposed || !parentRef.current) return;
      const Phaser = PhaserMod.default ?? PhaserMod;
      gameRef.current = createFlappyBotsPhaserGame({
        Phaser,
        parent: parentRef.current,
        getFrame: () => frameRef.current,
      });
    })().catch(() => {});

    return () => {
      disposed = true;
      try {
        gameRef.current?.destroy(true);
      } catch {
        // ignore
      }
      gameRef.current = null;
    };
  }, []);

  return (
    <>
      <div className='flappybots-canvas' ref={parentRef} aria-hidden='true' />
      {botStyle ? <div className='flappybots-dom-bot' style={botStyle} aria-hidden='true' /> : null}
    </>
  );
}
