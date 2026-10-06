/** @vitest-environment jsdom */
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { WorkoutDetail, type WorkoutDetailProps } from './workout-detail.tsx'

afterEach(cleanup)

const props = (overrides: Partial<WorkoutDetailProps> = {}): WorkoutDetailProps => ({
  title: 'Push day',
  day: 'Thu, Oct 1',
  times: '18:10 – 19:05',
  setCount: 3,
  open: false,
  groups: [
    {
      exerciseId: 'e-bench',
      name: 'Bench press',
      equipmentName: 'Olympic bar',
      rows: [
        { id: 's-1', setNumber: 1, label: '20 kg/side × 8', pending: false },
        { id: 's-2', setNumber: 2, label: '22.5 kg/side × 6', pending: false },
      ],
    },
    {
      exerciseId: 'e-press',
      name: 'Shoulder press',
      equipmentName: null,
      rows: [{ id: 's-3', setNumber: 1, label: 'Pin 7 × 10', pending: false }],
    },
  ],
  deleting: false,
  deleteFailed: false,
  onEdit: vi.fn(),
  onDelete: vi.fn(),
  ...overrides,
})

describe('WorkoutDetail', () => {
  it('shows the workout and its sets by exercise, in the order they were logged', () => {
    render(<WorkoutDetail {...props()} />)

    expect(screen.getByRole('heading', { level: 1, name: 'Push day' })).toBeDefined()
    expect(screen.getByText('Thu, Oct 1 · 18:10 – 19:05')).toBeDefined()

    const bench = screen.getByRole('region', { name: 'Bench press' })
    expect(
      within(bench)
        .getAllByRole('button')
        .map((row) => row.textContent),
    ).toEqual([
      expect.stringMatching(/1.*20 kg\/side × 8/),
      expect.stringMatching(/2.*22.5 kg\/side × 6/),
    ])
    expect(screen.getByRole('region', { name: 'Shoulder press' })).toBeDefined()
  })

  it('opens a set for correcting when it is tapped', async () => {
    const onEdit = vi.fn()
    render(<WorkoutDetail {...props({ onEdit })} />)

    await userEvent.click(screen.getByRole('button', { name: 'Edit set 1, Pin 7 × 10' }))
    expect(onEdit).toHaveBeenCalledWith('s-3')
  })

  it('asks before deleting, naming the workout and what goes with it', async () => {
    const onDelete = vi.fn()
    render(<WorkoutDetail {...props({ onDelete })} />)

    await userEvent.click(screen.getByRole('button', { name: 'Delete workout' }))
    expect(onDelete).not.toHaveBeenCalled()

    const confirm = screen.getByRole('alertdialog', { name: 'Delete Push day?' })
    expect(confirm.textContent).toMatch(/Thu, Oct 1.*3 sets/)
    await userEvent.click(within(confirm).getByRole('button', { name: 'Delete' }))

    expect(onDelete).toHaveBeenCalledOnce()
  })

  it('cancels without deleting', async () => {
    const onDelete = vi.fn()
    render(<WorkoutDetail {...props({ onDelete })} />)

    await userEvent.click(screen.getByRole('button', { name: 'Delete workout' }))
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(screen.queryByRole('alertdialog')).toBeNull()
    expect(onDelete).not.toHaveBeenCalled()
  })

  it('says it is working while deleting, and says so when it failed', () => {
    const { rerender } = render(<WorkoutDetail {...props({ deleting: true })} />)
    expect(screen.getByRole('button', { name: 'Deleting…' }).hasAttribute('disabled')).toBe(true)

    rerender(<WorkoutDetail {...props({ deleteFailed: true })} />)
    expect(screen.getByRole('alert').textContent).toMatch(/not deleted/)
  })

  it('says when a workout has no sets', () => {
    render(<WorkoutDetail {...props({ groups: [], setCount: 0 })} />)

    expect(screen.getByText('No sets logged.')).toBeDefined()
  })
})
