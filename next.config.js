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

module.exports = {
  reactStrictMode: true,
  ...(process.env.VERCEL ? {} : { distDir: '.next_local' }),
  async headers() {
    const frameAncestors = resolveFrameAncestors();
    return [
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
