/** @vitest-environment jsdom */
import type { UseMutationResult } from '@tanstack/react-query'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { RollbackNotice } from './rollback-notice.tsx'

const mutation = (state: Partial<UseMutationResult<unknown, Error, string>>) =>
  ({ isError: false, isPaused: false, mutate: vi.fn(), ...state }) as unknown as UseMutationResult<
    unknown,
    Error,
    string
  >

afterEach(cleanup)

describe('RollbackNotice', () => {
  it('shows nothing while the change is fine', () => {
    const { container } = render(<RollbackNotice mutation={mutation({})} />)

    expect(container.textContent).toBe('')
  })

  it('says the change was not saved and sends the same change again', async () => {
    const failed = mutation({ isError: true, variables: 'LB' })
    render(<RollbackNotice mutation={failed} />)

    expect(screen.getByRole('status').textContent).toMatch(/not saved/i)
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }))

    expect(failed.mutate).toHaveBeenCalledWith('LB')
  })

  it('says a change made offline is waiting for the network', () => {
    render(<RollbackNotice mutation={mutation({ isPaused: true })} />)

    expect(screen.getByRole('status').textContent).toMatch(/saves when you're back online/i)
  })
})
