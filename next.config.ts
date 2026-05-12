import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  serverExternalPackages: ['@prisma/client', 'prisma'],
  env: {
    NEXT_PUBLIC_BOOKING_URL: process.env.BOOKING_URL ?? '#',
  },
}

export default nextConfig
