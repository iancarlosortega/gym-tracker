import { describe, expect, it, vi } from 'vitest'
import { SignOutUseCase } from './sign-out.use-case.ts'

describe('SignOutUseCase', () => {
  it('ends the session, then leaves for sign-in', async () => {
    const steps: string[] = []

    await new SignOutUseCase(
      async () => {
        steps.push('end')
      },
      () => steps.push('leave'),
    ).execute()

    expect(steps).toEqual(['end', 'leave'])
  })

  it('stays put when the server cannot end the session', async () => {
    const leave = vi.fn()
    const signOut = new SignOutUseCase(() => Promise.reject(new Error('offline')), leave)

    await expect(signOut.execute()).rejects.toThrow('offline')
    expect(leave).not.toHaveBeenCalled()
  })
})
