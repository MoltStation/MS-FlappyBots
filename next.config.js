/** @type {import('next').NextConfig} */
function resolveFrameAncestors() {
  const configured = String(
    process.env.NEXT_PUBLIC_ALLOWED_FRAME_ANCESTORS ||
      process.env.NEXT_PUBLIC_ALLOWED_PARENT_ORIGINS ||
      process.env.NEXT_PUBLIC_CORE_ALLOWED_ORIGINS ||
      ''
  )
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);

  const isProd = String(process.env.NODE_ENV || '').trim().toLowerCase() === 'production';
  const localDefaults = isProd
    ? []
    : [
        'http://127.0.0.1:3000',
        'http://localhost:3000',
        'http://127.0.0.1:3001',
        'http://localhost:3001',
      ];
  return [...new Set([...configured, ...localDefaults])].join(' ');
}

const SECURITY_HEADERS = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'geolocation=(), camera=(), microphone=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
];

module.exports = {
  reactStrictMode: true,
  ...(process.env.VERCEL ? {} : { distDir: '.next_local' }),
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'ms-flappybots.vercel.app' }],
        destination: 'https://flappybots.moltstation.games/:path*',
        permanent: true,
      },
    ];
  },
  async headers() {
    const frameAncestors = resolveFrameAncestors();
    return [
      {
        source: '/:path*',
        headers: SECURITY_HEADERS,
      },
      {
        source: '/flappybots',
        headers: [{ key: 'Content-Security-Policy', value: `frame-ancestors ${frameAncestors};` }],
      },
      {
        source: '/flappybots/test',
        headers: [{ key: 'Content-Security-Policy', value: `frame-ancestors ${frameAncestors};` }],
      },
      {
        source: '/flappybots/spectate',
        headers: [{ key: 'Content-Security-Policy', value: `frame-ancestors ${frameAncestors};` }],
      },
    ];
  },
};
