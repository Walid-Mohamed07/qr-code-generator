/** @type {import('next').NextConfig} */
const nextConfig = {
  // ── Output ────────────────────────────────────────────────────────────────
  // 'standalone' bundles only the files needed to run the app, ideal for
  // Docker / self-hosted deployments. Remove this line if deploying to Vercel
  // (Vercel handles its own bundling and this setting is a no-op there).
  // output: 'standalone',

  // ── TypeScript / ESLint ───────────────────────────────────────────────────
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },

  // ── Images ────────────────────────────────────────────────────────────────
  images: {
    remotePatterns: [],
  },

  // ── Headers ───────────────────────────────────────────────────────────────
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
