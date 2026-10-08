'use client'

import { type QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { SignInNavigatorContainer } from '@/features/auth/presentation/containers/sign-in-navigator.container'
import { makeQueryClient } from '@/lib/query-client'

let browserQueryClient: QueryClient | undefined

/**
 * One client per browser, so a render that suspends cannot throw away the
 * cache; a fresh one per server render, so no request sees another's data.
 */
const getQueryClient = (): QueryClient => {
  if (typeof window === 'undefined') {
    return makeQueryClient()
  }
  browserQueryClient ??= makeQueryClient()
  return browserQueryClient
}

export const Providers = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={getQueryClient()}>
    <SignInNavigatorContainer />
    {children}
  </QueryClientProvider>
)
