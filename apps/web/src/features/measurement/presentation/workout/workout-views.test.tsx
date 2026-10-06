/** @vitest-environment jsdom */
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { DoneSets, ExerciseFocus, LogRow, WorkoutHeader } from './workout-views.tsx'

afterEach(cleanup)

describe('WorkoutHeader', () => {
  it('names the workout, shows its time, and finishes it', async () => {
    const onFinish = vi.fn()
    render(<WorkoutHeader title="Push day" elapsed="32:10" finishing={false} onFinish={onFinish} />)

    expect(screen.getByRole('heading').textContent).toBe('Push day · 32:10')
    expect(screen.getByRole('link', { name: 'Minimize workout' }).getAttribute('href')).toBe('/')

    await userEvent.click(screen.getByRole('button', { name: 'Finish' }))
    expect(onFinish).toHaveBeenCalledOnce()
  })
})

describe('ExerciseFocus', () => {
  const props = {
    position: 1,
    count: 5,
    plan: '4 × 6–8',
    name: 'Bench press',
    done: 2,
    target: 4,
    equipmentName: 'Olympic bar',
  }

  it('says where the workout is and what the plan asks', () => {
    render(<ExerciseFocus {...props} onPickEquipment={vi.fn()} />)

    expect(screen.getByText('Exercise 1 of 5 · 4 × 6–8')).toBeDefined()
    expect(screen.getByRole('heading', { name: 'Bench press' })).toBeDefined()
    expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('2')
    expect(screen.getByRole('progressbar').getAttribute('aria-valuemax')).toBe('4')
  })

  it('changes the equipment with one tap, and asks for it when none is chosen', async () => {
    const onPickEquipment = vi.fn()
    const { rerender } = render(<ExerciseFocus {...props} onPickEquipment={onPickEquipment} />)

    await userEvent.click(screen.getByRole('button', { name: 'Equipment: Olympic bar. Change' }))
    expect(onPickEquipment).toHaveBeenCalledOnce()

    rerender(<ExerciseFocus {...props} equipmentName={null} onPickEquipment={onPickEquipment} />)
    expect(screen.getByRole('button', { name: 'Pick the equipment' })).toBeDefined()
  })
})

describe('DoneSets', () => {
  it('lists the sets done, marking the ones still waiting to sync', () => {
    render(
      <DoneSets
        rows={[
          { id: 's-1', setNumber: 1, label: '60 kg × 8', pending: false },
          { id: 's-2', setNumber: 2, label: '62.5 kg × 6', pending: true },
        ]}
      />,
    )

    const rows = screen.getAllByRole('listitem').map((row) => row.textContent)
    expect(rows[0]).toMatch(/1.*60 kg × 8/)
    expect(rows[1]).toMatch(/2.*62.5 kg × 6.*waiting to sync/)
  })

  it('opens a set for editing when it is tapped', async () => {
    const onEdit = vi.fn()
    render(
      <DoneSets
        rows={[{ id: 's-1', setNumber: 1, label: '60 kg × 8', pending: false }]}
        onEdit={onEdit}
      />,
    )

    await userEvent.click(screen.getByRole('button', { name: 'Edit set 1, 60 kg × 8' }))

    expect(onEdit).toHaveBeenCalledWith('s-1')
  })

  it('shows nothing before the first set', () => {
    const { container } = render(<DoneSets rows={[]} />)

    expect(container.textContent).toBe('')
  })
})

describe('LogRow', () => {
  it('logs the next set and moves between exercises', async () => {
    const handlers = { onLog: vi.fn(), onPrevious: vi.fn(), onNext: vi.fn() }
    render(<LogRow setNumber={3} canLog hasPrevious={false} hasNext {...handlers} />)

    await userEvent.click(screen.getByRole('button', { name: 'Log set 3' }))
    await userEvent.click(screen.getByRole('button', { name: 'Next exercise' }))

    expect(handlers.onLog).toHaveBeenCalledOnce()
    expect(handlers.onNext).toHaveBeenCalledOnce()
    expect(screen.getByRole('button', { name: 'Previous exercise' }).hasAttribute('disabled')).toBe(
      true,
    )
  })

  it('cannot log until the set is complete', () => {
    render(
      <LogRow
        setNumber={1}
        canLog={false}
        hasPrevious={false}
        hasNext={false}
        onLog={vi.fn()}
        onPrevious={vi.fn()}
        onNext={vi.fn()}
      />,
    )

    expect(screen.getByRole('button', { name: 'Log set 1' }).hasAttribute('disabled')).toBe(true)
  })
})
