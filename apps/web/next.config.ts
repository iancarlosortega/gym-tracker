import { join } from 'node:path'
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Traces the server bundle and its real dependencies into .next/standalone,
  // so the image ships what runs instead of the whole workspace.
  output: 'standalone',
  // The app is one folder inside a pnpm workspace; tracing has to start above it.
  outputFileTracingRoot: join(import.meta.dirname, '../../'),
  transpilePackages: ['@gym/domain', '@gym/contracts'],
}

export default nextConfig
