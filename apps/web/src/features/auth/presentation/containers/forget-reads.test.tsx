/** @vitest-environment jsdom */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { SignInContainer } from './sign-in.container.tsx'
import { SignUpContainer } from './sign-up.container.tsx'

vi.mock('next/navigation', () => ({ useRouter: () => ({ replace: vi.fn() }) }))

afterEach(cleanup)

const withCache = (cache: QueryClient, ui: ReactNode) =>
  render(<QueryClientProvider client={cache}>{ui}</QueryClientProvider>)

const signedInCache = () => {
  const cache = new QueryClient()
  cache.setQueryData(['me'], { email: 'ian@example.com' })
  return cache
}

describe('arriving signed out', () => {
  it('forgets what the last session read, on sign-in', () => {
    const cache = signedInCache()

    withCache(cache, <SignInContainer next={undefined} />)

    expect(cache.getQueryData(['me'])).toBeUndefined()
  })

  it('forgets what the last session read, on register', () => {
    const cache = signedInCache()

    withCache(cache, <SignUpContainer next={undefined} />)

    expect(cache.getQueryData(['me'])).toBeUndefined()
  })
})
