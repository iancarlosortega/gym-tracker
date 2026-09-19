import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@gym/domain', '@gym/contracts'],
}

export default nextConfig
