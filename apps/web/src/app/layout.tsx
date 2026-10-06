import './globals.css'
import { Geist } from 'next/font/google'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Providers } from './providers'

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' })

export const metadata = {
  title: 'Gym Tracker',
  description: 'Personal workout logging and progression',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    // iOS ignores SVG and manifest icons for the home screen; it reads only this.
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180' }],
  },
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
    {/*
      The app draws under a translucent status bar (viewportFit cover), so the
      one place that clears it is here: every route, signed in or not, inherits
      it, and the background fills behind the clock.
    */}
    <body className="flex min-h-dvh flex-col bg-background pt-[env(safe-area-inset-top)] text-foreground">
      <Providers>{children}</Providers>
    </body>
  </html>
)

export default RootLayout
