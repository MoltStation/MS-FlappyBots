export function resolveApiBase() {
  const explicit = String(process.env.NEXT_PUBLIC_MOLTBOT_API_URL || '').trim();
  if (explicit) return explicit.replace(/\/+$/, '');
  if (typeof window === 'undefined') return '';
  const host = String(window.location.hostname || '').toLowerCase();
  const protocol = String(window.location.protocol || 'https:');
  if (host === 'localhost' || host === '127.0.0.1') return 'http://localhost:4100';
  if (host.startsWith('game.')) return `${protocol}//api.${host.slice(5)}`;
  return '';
}

export function resolveWsBaseFromApi(apiBase: string) {
  const raw = String(apiBase || '').trim();
  if (!raw) return null;
  if (raw.startsWith('https://')) return raw.replace(/^https:\/\//, 'wss://');
  if (raw.startsWith('http://')) return raw.replace(/^http:\/\//, 'ws://');
  return null;
}

export function resolveAllowedParentOrigins() {
  const configured = String(
    process.env.NEXT_PUBLIC_ALLOWED_PARENT_ORIGINS ||
      process.env.NEXT_PUBLIC_CORE_ALLOWED_ORIGINS ||
      ''
  )
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
  const isProd = String(process.env.NODE_ENV || '').trim().toLowerCase() === 'production';
  const localDefaults = isProd ? [] : ['http://127.0.0.1:3000', 'http://localhost:3000'];
  return new Set([...configured, ...localDefaults]);
}

export function resolveCoreOriginFromQuery(fallback: string) {
  if (typeof window === 'undefined') return fallback;
  const fallbackUrl = String(fallback || '').trim() || window.location.origin;
  try {
    const params = new URLSearchParams(window.location.search);
    const coreOrigin = String(params.get('coreOrigin') || '').trim();
    if (coreOrigin) return new URL(coreOrigin).origin;
  } catch {
    // ignore
  }
  return fallbackUrl;
}
