/** @vitest-environment jsdom */
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { SignUpForm, type SignUpFormProps } from './sign-up-form.tsx'

afterEach(cleanup)

const renderForm = (overrides: Partial<SignUpFormProps> = {}) => {
  const onSubmit = vi.fn()
  render(
    <SignUpForm
      pending={false}
      failure={null}
      signInHref="/sign-in?next=%2Froutines"
      onSubmit={onSubmit}
      {...overrides}
    />,
  )
  return { onSubmit, user: userEvent.setup() }
}

describe('SignUpForm', () => {
  it('submits a usable email and a long enough password', async () => {
    const { onSubmit, user } = renderForm()

    await user.type(screen.getByLabelText('Email'), 'ana@example.com')
    await user.type(screen.getByLabelText('Password'), 'correct horse')
    await user.click(screen.getByRole('button', { name: /create account/i }))

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        { email: 'ana@example.com', password: 'correct horse' },
        expect.anything(),
      ),
    )
  })

  it('refuses a short password before anything is sent', async () => {
    const { onSubmit, user } = renderForm()

    await user.type(screen.getByLabelText('Email'), 'ana@example.com')
    await user.type(screen.getByLabelText('Password'), 'short')
    await user.click(screen.getByRole('button', { name: /create account/i }))

    expect(await screen.findByText('Use at least 8 characters.')).toBeDefined()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('refuses an address that cannot be an email', async () => {
    const { onSubmit, user } = renderForm()

    await user.type(screen.getByLabelText('Email'), 'ana')
    await user.type(screen.getByLabelText('Password'), 'correct horse')
    await user.click(screen.getByRole('button', { name: /create account/i }))

    expect(await screen.findByText('Enter a usable email address.')).toBeDefined()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('marks the length hint as met once the password reaches 8 characters', async () => {
    const { user } = renderForm()
    const hint = () => screen.getByText('At least 8 characters')

    expect(hint().closest('[data-met]')?.getAttribute('data-met')).toBe('false')
    await user.type(screen.getByLabelText('Password'), '12345678')
    expect(hint().closest('[data-met]')?.getAttribute('data-met')).toBe('true')
  })

  it('offers sign-in, keeping where the visitor was going, when the email is taken', () => {
    renderForm({ failure: { kind: 'email-taken' } })

    expect(screen.getByText('An account with that email already exists.')).toBeDefined()
    expect(screen.getByRole('link', { name: 'Sign in instead' }).getAttribute('href')).toBe(
      '/sign-in?next=%2Froutines',
    )
  })

  it('asks the visitor to wait when there were too many attempts', () => {
    renderForm({ failure: { kind: 'rate-limited' } })

    expect(screen.getByText('Too many attempts. Wait a minute and try again.')).toBeDefined()
  })

  it("shows the server's reason when it refuses the details", () => {
    renderForm({ failure: { kind: 'rejected', reason: 'That email address is not usable.' } })

    expect(screen.getByText('That email address is not usable.')).toBeDefined()
  })

  it('disables the button while the account is being created', () => {
    renderForm({ pending: true })

    expect(screen.getByRole('button', { name: /creating account/i }).hasAttribute('disabled')).toBe(
      true,
    )
  })

  it('links back to sign-in for someone who already has an account', () => {
    renderForm()

    expect(screen.getByRole('link', { name: 'Sign in' }).getAttribute('href')).toBe(
      '/sign-in?next=%2Froutines',
    )
  })
})
