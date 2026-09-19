import type { ReactNode } from 'react'

export const metadata = {
  title: 'Gym Tracker',
  description: 'Personal workout logging and progression',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
