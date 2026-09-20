/** @vitest-environment jsdom */
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { type ExerciseOption, SetEntryForm } from './set-entry-form.tsx'

const barbell = [{ id: 'equipment-1', name: 'Olympic bar' }]

const exercises: ExerciseOption[] = [
  { id: 'exercise-1', name: 'Bench press', defaultMode: 'PER_SIDE' },
  { id: 'exercise-2', name: 'Lat pulldown', defaultMode: 'STACK_POSITION' },
]

afterEach(cleanup)

describe('SetEntryForm', () => {
  it('labels the load by how the exercise is measured', async () => {
    render(<SetEntryForm exercises={exercises} equipment={barbell} onSubmit={vi.fn()} />)

    expect(screen.getByLabelText('Weight per side (kg)')).toBeDefined()

    await userEvent.selectOptions(screen.getByLabelText('Exercise'), 'exercise-2')

    // A pin position is not a weight, and the field must never say it is.
    expect(screen.getByLabelText('Pin position')).toBeDefined()
  })

  it('refuses an empty set and says which field is wrong', async () => {
    const onSubmit = vi.fn()
    render(<SetEntryForm exercises={exercises} equipment={barbell} onSubmit={onSubmit} />)

    await userEvent.click(screen.getByRole('button', { name: 'Log set' }))

    expect(onSubmit).not.toHaveBeenCalled()
    // Both the load and the reps are missing, and both say so.
    expect(await screen.findAllByText('Enter a number.')).toHaveLength(2)
  })

  it('marks the field itself invalid, not only the message', async () => {
    render(<SetEntryForm exercises={exercises} equipment={barbell} onSubmit={vi.fn()} />)

    await userEvent.click(screen.getByRole('button', { name: 'Log set' }))

    // What a screen reader is told, rather than what the eye is shown.
    expect(await screen.findByLabelText('Reps')).toHaveProperty('ariaInvalid', 'true')
  })

  it('refuses a load of zero rather than logging an empty bar', async () => {
    const onSubmit = vi.fn()
    render(<SetEntryForm exercises={exercises} equipment={barbell} onSubmit={onSubmit} />)

    await userEvent.type(screen.getByLabelText('Weight per side (kg)'), '0')
    await userEvent.type(screen.getByLabelText('Reps'), '8')
    await userEvent.click(screen.getByRole('button', { name: 'Log set' }))

    expect(onSubmit).not.toHaveBeenCalled()
    expect(await screen.findByText('That has to be more than zero.')).toBeDefined()
  })

  it('refuses a fractional rep count', async () => {
    const onSubmit = vi.fn()
    render(<SetEntryForm exercises={exercises} equipment={barbell} onSubmit={onSubmit} />)

    await userEvent.type(screen.getByLabelText('Weight per side (kg)'), '20')
    await userEvent.type(screen.getByLabelText('Reps'), '8.5')
    await userEvent.click(screen.getByRole('button', { name: 'Log set' }))

    expect(onSubmit).not.toHaveBeenCalled()
    expect(await screen.findByText('Reps are whole numbers.')).toBeDefined()
  })

  it('submits the set as numbers, not as the strings the DOM gave it', async () => {
    const onSubmit = vi.fn()
    render(<SetEntryForm exercises={exercises} equipment={barbell} onSubmit={onSubmit} />)

    await userEvent.type(screen.getByLabelText('Weight per side (kg)'), '20')
    await userEvent.type(screen.getByLabelText('Reps'), '8')
    await userEvent.click(screen.getByRole('button', { name: 'Log set' }))

    expect(onSubmit).toHaveBeenCalledWith({
      exerciseId: 'exercise-1',
      equipmentId: 'equipment-1',
      load: 20,
      reps: 8,
    })
  })

  it('clears the load and reps for the next set but keeps the exercise', async () => {
    render(<SetEntryForm exercises={exercises} equipment={barbell} onSubmit={vi.fn()} />)

    await userEvent.type(screen.getByLabelText('Weight per side (kg)'), '20')
    await userEvent.type(screen.getByLabelText('Reps'), '8')
    await userEvent.click(screen.getByRole('button', { name: 'Log set' }))

    expect(
      (await screen.findByLabelText('Weight per side (kg)')) as HTMLInputElement,
    ).toHaveProperty('value', '')
    expect(screen.getByLabelText('Reps')).toHaveProperty('value', '')
    expect(screen.getByLabelText('Exercise')).toHaveProperty('value', 'exercise-1')
  })
})
