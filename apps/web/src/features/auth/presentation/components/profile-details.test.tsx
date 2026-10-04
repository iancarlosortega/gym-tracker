/** @vitest-environment jsdom */
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ProfileDetails, pendingSetsLabel } from './profile-details.tsx'

afterEach(cleanup)

describe('pendingSetsLabel', () => {
  it.each([
    [0, 'All sets synced'],
    [1, '1 set waiting to sync'],
    [4, '4 sets waiting to sync'],
  ])('reads %i as "%s"', (count, label) => {
    expect(pendingSetsLabel(count)).toBe(label)
  })
})

describe('ProfileDetails', () => {
  const props = {
    email: 'ian@example.com',
    pendingSets: 3,
    signingOut: false,
    signOutFailed: false,
  }

  it('shows who is signed in and what this phone still has to sync', () => {
    render(<ProfileDetails {...props} onSignOut={vi.fn()} />)

    expect(screen.getByText('ian@example.com')).toBeDefined()
    expect(screen.getByText('3 sets waiting to sync')).toBeDefined()
  })

  it('signs out', async () => {
    const onSignOut = vi.fn()
    render(<ProfileDetails {...props} onSignOut={onSignOut} />)

    await userEvent.click(screen.getByRole('button', { name: 'Sign out' }))

    expect(onSignOut).toHaveBeenCalledOnce()
  })

  it('cannot be pressed twice while signing out', () => {
    render(<ProfileDetails {...props} signingOut onSignOut={vi.fn()} />)

    expect(screen.getByRole('button', { name: /sign/i }).hasAttribute('disabled')).toBe(true)
  })

  it('says when signing out did not go through', () => {
    render(<ProfileDetails {...props} signOutFailed onSignOut={vi.fn()} />)

    expect(screen.getByRole('alert').textContent).toMatch(/still signed in/i)
  })
})
