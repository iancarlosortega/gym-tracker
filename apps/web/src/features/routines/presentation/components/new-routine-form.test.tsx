/** @vitest-environment jsdom */
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { NewRoutineForm } from './new-routine-form.tsx'

afterEach(cleanup)

describe('NewRoutineForm', () => {
  it('creates a routine with its name', async () => {
    const onSubmit = vi.fn()
    render(<NewRoutineForm pending={false} failed={false} onSubmit={onSubmit} />)

    await userEvent.type(screen.getByLabelText('Name'), ' Legs ')
    await userEvent.click(screen.getByRole('button', { name: 'Create routine' }))

    expect(onSubmit).toHaveBeenCalledWith('Legs')
  })

  it('refuses a blank name', async () => {
    const onSubmit = vi.fn()
    render(<NewRoutineForm pending={false} failed={false} onSubmit={onSubmit} />)

    await userEvent.click(screen.getByRole('button', { name: 'Create routine' }))

    expect(onSubmit).not.toHaveBeenCalled()
    expect(screen.getByText('Give it a name.')).toBeDefined()
  })

  it('says when the server did not take it', () => {
    render(<NewRoutineForm pending={false} failed onSubmit={vi.fn()} />)

    expect(screen.getByRole('alert')).toBeDefined()
  })
})
