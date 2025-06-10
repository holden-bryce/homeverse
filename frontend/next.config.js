/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // typedRoutes: true, // Temporarily disabled due to route type issues
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_MAPBOX_TOKEN: process.env.NEXT_PUBLIC_MAPBOX_TOKEN,
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' *.mapbox.com blob:; worker-src 'self' blob:; child-src 'self' blob:; style-src 'self' 'unsafe-inline' *.mapbox.com; img-src 'self' data: blob: *.mapbox.com https:; connect-src 'self' *.mapbox.com api.mapbox.com events.mapbox.com *.supabase.co wss://*.supabase.co https://homeverse-api.onrender.com http://localhost:8000; font-src 'self' data:; frame-src 'self'; object-src 'none';",
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(self)',
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig