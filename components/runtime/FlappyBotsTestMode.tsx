import { useCallback, useEffect, useRef, useState } from 'react';

import { formatScore } from '../../lib/api/scoring';
import { FlappyBotsEngine } from '../../lib/game/FlappyBotsEngine';
import { TICK_HZ } from '../../lib/game/constants';
import type { FlappyFrame } from '../../lib/game/types';
import FlappyBotsCanvas from './FlappyBotsCanvas';

export default function FlappyBotsTestMode() {
  const engineRef = useRef(new FlappyBotsEngine('test-mode'));
  const runningRef = useRef(false);
  const accumulatorRef = useRef(0);
  const [frame, setFrame] = useState<FlappyFrame>(() => engineRef.current.getFrame());
  const [started, setStarted] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [fullscreenActive, setFullscreenActive] = useState(false);

  const publishFrame = useCallback((nextFrame: FlappyFrame) => {
    setFrame(nextFrame);
    if (nextFrame.phase === 'ended') runningRef.current = false;
  }, []);

  const startRun = useCallback(() => {
    if (engineRef.current.isGameOver()) return;
    runningRef.current = true;
    accumulatorRef.current = 0;
    setStarted(true);
    engineRef.current.applyAction('FLAP');
    publishFrame(engineRef.current.getFrame());
  }, [publishFrame]);

  const flap = useCallback(() => {
    if (engineRef.current.isGameOver()) return;
    if (!runningRef.current) {
      startRun();
      return;
    }
    engineRef.current.applyAction('FLAP');
    publishFrame(engineRef.current.getFrame());
  }, [publishFrame, startRun]);

  const restart = useCallback(() => {
    runningRef.current = false;
    accumulatorRef.current = 0;
    engineRef.current.resetSession(`test-${Date.now()}`);
    setStarted(false);
    publishFrame(engineRef.current.getFrame());
  }, [publishFrame]);

  const onPlayfieldPointerDown = useCallback((evt: React.PointerEvent<HTMLElement>) => {
    if (!evt.isPrimary || evt.button !== 0) return;
    evt.preventDefault();
    flap();
  }, [flap]);

  const onHudPointerDown = useCallback((evt: React.PointerEvent<HTMLElement>) => {
    evt.stopPropagation();
  }, []);

  const onStartClick = useCallback((evt: React.MouseEvent<HTMLButtonElement>) => {
    evt.preventDefault();
    evt.stopPropagation();
    startRun();
  }, [startRun]);

  const onRestartClick = useCallback((evt: React.MouseEvent<HTMLButtonElement>) => {
    evt.preventDefault();
    evt.stopPropagation();
    restart();
  }, [restart]);

  const onFocusClick = useCallback(async (evt: React.MouseEvent<HTMLButtonElement>) => {
    evt.preventDefault();
    evt.stopPropagation();
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        setFocusMode(false);
        return;
      }
      await document.documentElement.requestFullscreen();
      setFocusMode(true);
    } catch {
      setFocusMode((enabled) => !enabled);
    }
  }, []);

  useEffect(() => {
    const onFullscreenChange = () => {
      const active = Boolean(document.fullscreenElement);
      setFullscreenActive(active);
      if (!active) setFocusMode(false);
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    onFullscreenChange();
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  useEffect(() => {
    let rafId = 0;
    let previousT = window.performance.now();
    const fixedDtMs = Math.floor(1000 / TICK_HZ);

    const tick = (now: number) => {
      const elapsedMs = Math.max(0, Math.min(250, now - previousT));
      previousT = now;
      if (runningRef.current) {
        accumulatorRef.current += elapsedMs;
        let nextFrame: FlappyFrame | null = null;
        let steps = 0;
        while (accumulatorRef.current >= fixedDtMs && steps < 6) {
          nextFrame = engineRef.current.step(fixedDtMs);
          accumulatorRef.current -= fixedDtMs;
          steps += 1;
          if (nextFrame.phase === 'ended') {
            accumulatorRef.current = 0;
            break;
          }
        }
        if (nextFrame) publishFrame(nextFrame);
      }
      rafId = window.requestAnimationFrame(tick);
    };

    rafId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(rafId);
  }, [publishFrame]);

  useEffect(() => {
    const onKeyDown = (evt: KeyboardEvent) => {
      if (evt.code !== 'Space') return;
      if (evt.repeat) return;
      if (evt.target instanceof HTMLElement && evt.target.tagName === 'BUTTON') return;
      evt.preventDefault();
      flap();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [flap]);

  return (
    <main
      className={`flappybots-page flappybots-page--test ${focusMode ? 'is-focus' : ''}`}
      onPointerDown={onPlayfieldPointerDown}>
      <FlappyBotsCanvas frame={frame} displayMode={focusMode ? 'practiceFocus' : 'practice'} />
      <section className='flappybots-hud flappybots-hud--right' onPointerDown={onHudPointerDown}>
        <img className='flappybots-logo flappybots-logo--hud' src='/assets/flappybots/logo.png' alt='Flappy Bots' />
        <div className='flappybots-mode-badge'>TEST MODE</div>
        <div className='flappybots-hud-top'>
          <strong>Flappy Bots</strong>
          <span>{frame.phase}</span>
        </div>
        <div className='flappybots-stat'>
          <span>Score</span>
          <strong>{formatScore(frame.score.current)}</strong>
        </div>
        <div className='flappybots-stat'>
          <span>Controls</span>
          <strong>{started ? 'Space / click / tap' : 'Tap to start'}</strong>
        </div>
        <p className='flappybots-note'>
          {started
            ? 'Demo scores are local only and are not eligible for official rewards.'
            : 'Press Space, click, or tap the playfield to launch the demo run.'}
        </p>
      </section>
      <section className='flappybots-test-actions' onPointerDown={onHudPointerDown}>
        {!started ? (
          <button className='flappybots-button' type='button' onClick={onStartClick}>
            Start Demo
          </button>
        ) : null}
        {frame.phase === 'ended' ? (
          <button className='flappybots-button' type='button' onClick={onRestartClick}>
            Restart Demo
          </button>
        ) : null}
        <button className='flappybots-button' type='button' onClick={onFocusClick}>
          {focusMode || fullscreenActive ? 'Normal Screen' : 'Full Screen'}
        </button>
      </section>
    </main>
  );
}
