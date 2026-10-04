/** @vitest-environment jsdom */
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { EditExerciseForm, NewExerciseForm } from './exercise-forms.tsx'

afterEach(cleanup)

describe('NewExerciseForm', () => {
  it('creates an exercise with its name and how it is loaded', async () => {
    const onSubmit = vi.fn()
    render(<NewExerciseForm pending={false} failed={false} onSubmit={onSubmit} />)

    await userEvent.type(screen.getByLabelText('Name'), '  Hip thrust ')
    await userEvent.click(screen.getByRole('radio', { name: /per side/i }))
    await userEvent.click(screen.getByRole('button', { name: 'Add exercise' }))

    expect(onSubmit).toHaveBeenCalledWith({ name: 'Hip thrust', defaultMode: 'PER_SIDE' })
  })

  it('explains each way of loading in plain words', () => {
    render(<NewExerciseForm pending={false} failed={false} onSubmit={vi.fn()} />)

    expect(screen.getAllByRole('radio')).toHaveLength(3)
    expect(
      screen.getByRole('radio', { name: /pin position/i }).closest('label')?.textContent,
    ).toMatch(/stack/i)
  })

  it('refuses a blank name', async () => {
    const onSubmit = vi.fn()
    render(<NewExerciseForm pending={false} failed={false} onSubmit={onSubmit} />)

    await userEvent.type(screen.getByLabelText('Name'), '   ')
    await userEvent.click(screen.getByRole('button', { name: 'Add exercise' }))

    expect(onSubmit).not.toHaveBeenCalled()
    expect(screen.getByText('Give it a name.')).toBeDefined()
  })

  it('says when the server did not take it', () => {
    render(<NewExerciseForm pending={false} failed onSubmit={vi.fn()} />)

    expect(screen.getByRole('alert')).toBeDefined()
  })
})

describe('EditExerciseForm', () => {
  const props = { name: 'Squat', pending: false, failed: false }

  it('renames', async () => {
    const onRename = vi.fn()
    render(<EditExerciseForm {...props} onRename={onRename} onArchive={vi.fn()} />)

    await userEvent.clear(screen.getByLabelText('Name'))
    await userEvent.type(screen.getByLabelText('Name'), 'Back squat')
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))

    expect(onRename).toHaveBeenCalledWith('Back squat')
  })

  it('archives', async () => {
    const onArchive = vi.fn()
    render(<EditExerciseForm {...props} onRename={vi.fn()} onArchive={onArchive} />)

    await userEvent.click(screen.getByRole('button', { name: /archive/i }))

    expect(onArchive).toHaveBeenCalledOnce()
  })
})
