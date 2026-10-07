/** @vitest-environment jsdom */
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { SignInForm } from './sign-in-form.tsx'

afterEach(cleanup)

describe('SignInForm', () => {
  it('links to register, keeping where the visitor was going', () => {
    render(
      <SignInForm
        pending={false}
        failure={null}
        registerHref="/register?next=%2Froutines"
        onSubmit={vi.fn()}
      />,
    )

    expect(screen.getByRole('link', { name: 'Create an account' }).getAttribute('href')).toBe(
      '/register?next=%2Froutines',
    )
  })

  it('asks the visitor to wait when there were too many attempts', () => {
    render(
      <SignInForm
        pending={false}
        failure="rate-limited"
        registerHref="/register"
        onSubmit={vi.fn()}
      />,
    )

    expect(screen.getByText('Too many attempts. Wait a minute and try again.')).toBeDefined()
  })

  it('offers no way to recover a password', () => {
    render(
      <SignInForm pending={false} failure={null} registerHref="/register" onSubmit={vi.fn()} />,
    )

    expect(screen.queryByText(/forgot|reset/i)).toBeNull()
  })
})
