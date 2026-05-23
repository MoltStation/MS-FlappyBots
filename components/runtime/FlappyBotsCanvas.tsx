import { useEffect, useRef } from 'react';

import { createFlappyBotsPhaserGame } from '../../lib/game/FlappyBotsScene';
import type { FlappyFrame } from '../../lib/game/types';

export default function FlappyBotsCanvas({ frame }: { frame: FlappyFrame | null }) {
  const parentRef = useRef<HTMLDivElement | null>(null);
  const gameRef = useRef<any>(null);
  const frameRef = useRef<FlappyFrame | null>(frame);

  useEffect(() => {
    frameRef.current = frame;
  }, [frame]);

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
    <div className='flappybots-canvas' ref={parentRef} aria-hidden='true' />
  );
}
