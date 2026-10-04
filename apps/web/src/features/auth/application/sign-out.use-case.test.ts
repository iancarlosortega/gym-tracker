import { QueryClient } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SignOutUseCase } from './sign-out.use-case.ts'

describe('SignOutUseCase', () => {
  let cache: QueryClient
  let steps: string[]

  beforeEach(() => {
    cache = new QueryClient()
    cache.setQueryData(['me'], { email: 'ian@example.com' })
    steps = []
  })

  const useCase = (endSession: () => Promise<void>) =>
    new SignOutUseCase(
      endSession,
      () => {
        steps.push('forget')
        cache.clear()
      },
      () => steps.push('leave'),
    )

  it('ends the session, forgets what was read, then leaves for sign-in', async () => {
    await useCase(async () => {
      steps.push('end')
    }).execute()

    expect(steps).toEqual(['end', 'forget', 'leave'])
    expect(cache.getQueryData(['me'])).toBeUndefined()
  })

  it('stays put and keeps everything when the server cannot end the session', async () => {
    const leave = vi.fn()
    const signOut = new SignOutUseCase(
      () => Promise.reject(new Error('offline')),
      () => cache.clear(),
      leave,
    )

    await expect(signOut.execute()).rejects.toThrow('offline')
    expect(cache.getQueryData(['me'])).toEqual({ email: 'ian@example.com' })
    expect(leave).not.toHaveBeenCalled()
  })
})
