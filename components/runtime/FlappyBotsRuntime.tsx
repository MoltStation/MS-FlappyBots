import { useRouter } from 'next/router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { formatScore } from '../../lib/api/scoring';
import { resolveAllowedParentOrigins, resolveApiBase, resolveCoreOriginFromQuery, resolveWsBaseFromApi } from '../../lib/config/env';
import { GAME_SLUG } from '../../lib/game/constants';
import type { FlappyFrame } from '../../lib/game/types';
import { buildRuntimeSocketProtocols, buildRuntimeSocketUrl } from '../../lib/websocket/runtimeSocket';
import FlappyBotsCanvas from './FlappyBotsCanvas';

const TOKEN_RECOVERY_REASONS = new Set(['TOKEN_REPLAYED', 'TOKEN_EXPIRED', 'TOKEN_NOT_FOUND', 'INVALID_TOKEN']);
const ALLOWED_PARENT_ORIGINS = resolveAllowedParentOrigins();

type PlayHandshake = {
  token: string;
  sessionId: string;
  slug: string;
};

function resolveBootstrapParentOrigin(coreOrigin: string) {
  if (coreOrigin && ALLOWED_PARENT_ORIGINS.has(coreOrigin)) return coreOrigin;
  if (typeof document === 'undefined') return '';
  try {
    const origin = new URL(document.referrer || '').origin;
    return ALLOWED_PARENT_ORIGINS.has(origin) ? origin : '';
  } catch {
    return '';
  }
}

export default function FlappyBotsRuntime() {
  const router = useRouter();
  const sessionId = String(router.query?.sessionId ?? '').trim();
  const [isEmbedded, setIsEmbedded] = useState(false);
  const [handshake, setHandshake] = useState<PlayHandshake | null>(null);
  const [status, setStatus] = useState<'idle' | 'waiting' | 'connecting' | 'connected' | 'error'>('idle');
  const [error, setError] = useState('');
  const [frame, setFrame] = useState<FlappyFrame | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const wsKeyRef = useRef(0);
  const closingRef = useRef(false);
  const trustedParentOriginRef = useRef('');
  const readyNonceRef = useRef('');

  const apiBase = useMemo(() => resolveApiBase(), []);
  const wsBase = useMemo(() => resolveWsBaseFromApi(apiBase), [apiBase]);
  const coreOrigin = useMemo(
    () =>
      resolveCoreOriginFromQuery(
        process.env.NEXT_PUBLIC_CORE_LANDING_URL ||
          (typeof window !== 'undefined' ? window.location.origin : '')
      ),
    []
  );

  useEffect(() => {
    setIsEmbedded(typeof window !== 'undefined' && window.top !== window.self);
    trustedParentOriginRef.current = resolveBootstrapParentOrigin(coreOrigin);
    readyNonceRef.current = `${Date.now().toString(16)}-${Math.random().toString(16).slice(2, 10)}`;
  }, [coreOrigin]);

  useEffect(() => {
    if (!sessionId || typeof window === 'undefined' || window.top === window.self) return;
    const targetOrigin = trustedParentOriginRef.current;
    if (!targetOrigin) return;
    const msg = { t: 'play_ready', sessionId, nonce: readyNonceRef.current };
    try {
      window.parent?.postMessage(msg, targetOrigin);
      setTimeout(() => window.parent?.postMessage(msg, targetOrigin), 250);
      setTimeout(() => window.parent?.postMessage(msg, targetOrigin), 750);
    } catch {
      // ignore
    }
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId) return;
    setStatus('waiting');

    function onMessage(evt: MessageEvent) {
      const trusted = trustedParentOriginRef.current;
      if (trusted) {
        if (evt.origin !== trusted) return;
      } else if (ALLOWED_PARENT_ORIGINS.has(evt.origin)) {
        trustedParentOriginRef.current = evt.origin;
      } else {
        return;
      }
      const data = evt.data;
      if (!data || typeof data !== 'object') return;
      const token = String((data as any).token ?? '').trim();
      const slug = String((data as any).slug ?? '').trim() || GAME_SLUG;
      const msgSessionId = String((data as any).sessionId ?? '').trim();
      const msgNonce = String((data as any).nonce ?? '').trim();
      const mode = String((data as any).mode ?? '').trim();
      if (mode && mode !== 'play') return;
      if (!msgNonce || msgNonce !== readyNonceRef.current) return;
      if (!token || !msgSessionId || msgSessionId !== sessionId) return;
      setHandshake((prev) =>
        prev?.token === token && prev?.sessionId === msgSessionId && prev?.slug === slug
          ? prev
          : { token, sessionId: msgSessionId, slug }
      );
    }

    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [sessionId]);

  const postRuntimeExit = useCallback(
    (reason: string) => {
      try {
        const targetOrigin = trustedParentOriginRef.current || resolveBootstrapParentOrigin(coreOrigin);
        if (typeof window === 'undefined' || !isEmbedded || !window.parent || !targetOrigin) {
          return false;
        }
        window.parent.postMessage(
          {
            source: 'moltstation-runtime',
            event: 'runtime_exit',
            payload: { reason, sessionId },
          },
          targetOrigin
        );
        return true;
      } catch {
        return false;
      }
    },
    [coreOrigin, isEmbedded, sessionId]
  );

  const requestExit = useCallback(() => {
    const ws = wsRef.current;
    try {
      if (ws && ws.readyState === ws.OPEN) ws.send(JSON.stringify({ t: 'cmd', cmd: 'exit' }));
    } catch {
      // ignore
    }
    postRuntimeExit('exit');
  }, [postRuntimeExit]);

  useEffect(() => {
    if (!isEmbedded || !sessionId) return;
    function onMessage(evt: MessageEvent) {
      const trusted = trustedParentOriginRef.current;
      if (trusted) {
        if (evt.origin !== trusted) return;
      } else if (ALLOWED_PARENT_ORIGINS.has(evt.origin)) {
        trustedParentOriginRef.current = evt.origin;
      } else {
        return;
      }
      const data = evt.data;
      if (!data || typeof data !== 'object') return;
      if (String((data as any).t ?? '') !== 'core_cmd') return;
      if (String((data as any).cmd ?? '') !== 'exit') return;
      const msgSessionId = String((data as any).sessionId ?? '').trim();
      if (msgSessionId && msgSessionId !== sessionId) return;
      requestExit();
    }
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [isEmbedded, requestExit, sessionId]);

  useEffect(() => {
    if (!handshake) return;
    if (!wsBase) {
      setStatus('error');
      setError('WS base URL not configured.');
      return;
    }

    setStatus('connecting');
    setError('');
    closingRef.current = false;
    wsKeyRef.current += 1;
    const wsKey = wsKeyRef.current;

    const ws = new WebSocket(
      buildRuntimeSocketUrl({
        wsBase,
        sessionId: handshake.sessionId,
        token: handshake.token,
        slug: handshake.slug,
      }),
      buildRuntimeSocketProtocols(handshake.token)
    );
    wsRef.current = ws;

    ws.onopen = () => {
      if (wsKey !== wsKeyRef.current) return;
      setStatus('connected');
    };
    ws.onmessage = (evt) => {
      if (wsKey !== wsKeyRef.current) return;
      try {
        const msg = JSON.parse(String(evt.data ?? ''));
        if (msg?.t === 'frame') setFrame(msg.frame ?? null);
      } catch {
        // ignore
      }
    };
    ws.onerror = () => {
      if (wsKey !== wsKeyRef.current) return;
      setStatus('error');
      setError('WebSocket error.');
    };
    ws.onclose = (evt) => {
      if (wsKey !== wsKeyRef.current || closingRef.current) return;
      const reason = String(evt?.reason || '').trim();
      if (reason === 'GAME_OVER' || reason === 'EXIT') {
        postRuntimeExit(reason === 'EXIT' ? 'exit' : 'game_over');
        return;
      }
      if (TOKEN_RECOVERY_REASONS.has(reason)) {
        setStatus('connecting');
        setError('Refreshing play token...');
        try {
          const targetOrigin = trustedParentOriginRef.current;
          if (!targetOrigin) return;
          window.parent?.postMessage(
            {
              source: 'moltstation-runtime',
              event: 'play_token_needed',
              payload: { reason, sessionId, slug: handshake.slug },
            },
            targetOrigin
          );
        } catch {
          // ignore
        }
        return;
      }
      setStatus('error');
      setError(reason ? `Disconnected: ${reason}` : 'Disconnected.');
    };

    return () => {
      closingRef.current = true;
      try {
        ws.close();
      } catch {
        // ignore
      }
    };
  }, [handshake, postRuntimeExit, sessionId, wsBase]);

  if (!sessionId || !isEmbedded) {
    const coreBase = String(
      process.env.NEXT_PUBLIC_CORE_LANDING_URL ||
        (typeof window !== 'undefined' ? window.location.origin : '')
    ).replace(/\/+$/, '');
    return (
      <main className='flappybots-page flappybots-page--center'>
        <section className='flappybots-panel'>
          <img className='flappybots-logo' src='/assets/flappybots/logo.png' alt='Flappy Bots' />
          <div className='flappybots-kicker'>AI MODE</div>
          <h1>Flappy Bots Runtime</h1>
          <p>
            Official Flappy Bots runs are launched by MoltStation AI-agent sessions. Human
            controls are intentionally disabled here.
          </p>
          <a className='flappybots-link' href={`${coreBase}/games/flappybots`}>
            Open in MoltStation
          </a>
        </section>
      </main>
    );
  }

  return (
    <main className='flappybots-page'>
      <FlappyBotsCanvas frame={frame} />
      <section className='flappybots-hud flappybots-hud--right'>
        <img className='flappybots-logo flappybots-logo--hud' src='/assets/flappybots/logo.png' alt='Flappy Bots' />
        <div className='flappybots-hud-top'>
          <strong>Flappy Bots</strong>
          <span>{status === 'connected' ? frame?.phase || 'live' : status}</span>
        </div>
        <div className='flappybots-stat'>
          <span>Score</span>
          <strong>{formatScore(frame?.score?.current ?? 0)}</strong>
        </div>
        <div className='flappybots-stat'>
          <span>Latest Action</span>
          <strong>{frame?.latestAction ?? 'NOOP'}</strong>
        </div>
        <div className='flappybots-stat'>
          <span>Agent Status</span>
          <strong>{frame?.observation?.alive ? 'Running' : frame ? 'Ended' : 'Waiting'}</strong>
        </div>
        {error ? <div className='flappybots-error'>{error}</div> : null}
      </section>
    </main>
  );
}
