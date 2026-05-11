import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Supabase Storage
      { protocol: 'https', hostname: '*.supabase.co', pathname: '/storage/v1/object/public/**' },
      // Common news outlet image CDNs
      { protocol: 'https', hostname: '*.chosun.com' },
      { protocol: 'https', hostname: '*.joins.com' },
      { protocol: 'https', hostname: '*.donga.com' },
      { protocol: 'https', hostname: '*.imbc.com' },
      { protocol: 'https', hostname: 'imgnews.pstatic.net' },
    ],
  },
  experimental: {
    serverActions: { allowedOrigins: ['localhost:3000'] },
  },
}

export default nextConfig
