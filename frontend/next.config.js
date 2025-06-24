/** @type {import('next').NextConfig} */
const nextConfig = {
  // Suppress webpack warnings for Supabase realtime
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Don't resolve 'fs' module on the client to prevent this error on build
      config.resolve.fallback = {
        fs: false,
        net: false,
        tls: false
      };
    }
    
    // Ignore the critical dependency warning from Supabase
    config.module = {
      ...config.module,
      exprContextCritical: false,
    };
    
    return config;
  },
  
  // Disable turbotrace as it may cause build timeouts
  // experimental: {
  //   turbotrace: {
  //     logLevel: 'error'
  //   }
  // },
  
  // Optimize for production
  swcMinify: true,
  
  // Handle environment variables
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_MAPBOX_TOKEN: process.env.NEXT_PUBLIC_MAPBOX_TOKEN,
  },
  
  // Ignore TypeScript errors during build (if needed)
  typescript: {
    // !! WARN !!
    // Set this to false once all TypeScript errors are fixed
    ignoreBuildErrors: false,
  },
  
  // Ignore ESLint errors during build (if needed)
  eslint: {
    // !! WARN !!
    // Set this to false once all ESLint errors are fixed
    ignoreDuringBuilds: false,
  },
}

module.exports = nextConfig