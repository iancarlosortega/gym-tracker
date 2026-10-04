/** @vitest-environment jsdom */
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ExerciseList } from './exercise-list.tsx'

afterEach(cleanup)

const exercise = (id: string, name: string, defaultMode: string, archived = false) => ({
  id,
  name,
  defaultMode: defaultMode as 'TOTAL' | 'PER_SIDE' | 'STACK_POSITION',
  archived,
})

const squat = exercise('e-1', 'Squat', 'TOTAL')
const hipThrust = exercise('e-2', 'Hip thrust', 'PER_SIDE')
const legPress = exercise('e-3', 'Leg press', 'STACK_POSITION')
const oldCurl = exercise('e-4', 'Old curl', 'TOTAL', true)

describe('ExerciseList', () => {
  it('lists each exercise with how it is loaded', () => {
    render(
      <ExerciseList exercises={[squat, hipThrust, legPress]} onNew={vi.fn()} onEdit={vi.fn()} />,
    )

    expect(screen.getByText('Hip thrust').closest('li')?.textContent).toMatch(/per side/)
    expect(screen.getByText('Squat').closest('li')?.textContent).toMatch(/total/)
    expect(screen.getByText('Leg press').closest('li')?.textContent).toMatch(/pin position/)
  })

  it('keeps archived exercises out of sight until asked', async () => {
    render(<ExerciseList exercises={[squat, oldCurl]} onNew={vi.fn()} onEdit={vi.fn()} />)

    expect(screen.queryByText('Old curl')).toBeNull()

    await userEvent.click(screen.getByRole('button', { name: 'Show archived (1)' }))

    expect(screen.getByText('Old curl')).toBeDefined()
  })

  it('does not offer archived ones when there are none', () => {
    render(<ExerciseList exercises={[squat]} onNew={vi.fn()} onEdit={vi.fn()} />)

    expect(screen.queryByRole('button', { name: /show archived/i })).toBeNull()
  })

  it('offers creating the first exercise on a fresh account', async () => {
    const onNew = vi.fn()
    render(<ExerciseList exercises={[]} onNew={onNew} onEdit={vi.fn()} />)

    await userEvent.click(screen.getByRole('button', { name: 'Add your first exercise' }))

    expect(onNew).toHaveBeenCalledOnce()
  })

  it('opens an exercise to rename or archive it', async () => {
    const onEdit = vi.fn()
    render(<ExerciseList exercises={[squat, hipThrust]} onNew={vi.fn()} onEdit={onEdit} />)

    await userEvent.click(screen.getByRole('button', { name: 'Edit Hip thrust' }))

    expect(onEdit).toHaveBeenCalledWith(hipThrust)
  })
})
