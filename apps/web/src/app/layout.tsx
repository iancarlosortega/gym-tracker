import './globals.css'
import { Geist } from 'next/font/google'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' })

export const metadata = {
  title: 'Gym Tracker',
  description: 'Personal workout logging and progression',
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, title: 'Gym', statusBarStyle: 'black-translucent' as const },
}

export const viewport = {
  themeColor: '#101014',
  // The logging surface is thumb-sized already; a pinch-zoom on a number pad
  // is an accident waiting to happen mid-set.
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover' as const,
}

const RootLayout = ({ children }: { children: ReactNode }) => (
  <html lang="en" className={cn('dark font-sans', geist.variable)}>
    <body className="bg-background text-foreground">{children}</body>
  </html>
)

export default RootLayout
