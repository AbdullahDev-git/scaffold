/** @type {import('next').NextConfig} */
const nextConfig = {
  // keep the sandboxed preview clean
  devIndicators: false,
  // the sandboxed preview is proxied through a generated host, so dev requests
  // arrive cross-origin — allow them explicitly
  allowedDevOrigins: ['*.e2b.app', '*.e2b.dev', 'localhost'],
  experimental: { serverActions: { allowedOrigins: ['*.e2b.app', 'localhost:3000'] } },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
        ],
      },
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https:",
              "font-src 'self'",
              "connect-src 'self' https://api.lemonsqueezy.com https://generativelanguage.googleapis.com https://api.mistral.ai",
              "frame-ancestors 'none'",
            ].join('; '),
          },
        ],
      },
    ];
  },
};

export default nextConfig;

