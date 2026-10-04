/** @vitest-environment jsdom */
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  EquipmentDetails,
  EquipmentList,
  equipmentSummary,
  usageLabel,
} from './equipment-views.tsx'

afterEach(cleanup)

const smith = {
  id: 'q-1',
  name: 'Smith machine',
  kind: 'BARBELL',
  barKilograms: 15,
  stackPositions: null,
  archived: false,
}
const legPress = {
  id: 'q-2',
  name: 'Leg press',
  kind: 'STACK',
  barKilograms: null,
  stackPositions: 20,
  archived: false,
}
const dumbbells = {
  ...legPress,
  id: 'q-3',
  name: 'Dumbbells',
  kind: 'FREE_WEIGHT',
  stackPositions: null,
}

describe('equipmentSummary', () => {
  it.each([
    [smith, 'bar 15 kg'],
    [legPress, 'stack · 20 positions'],
    [dumbbells, 'free weight'],
  ])('describes $name as "%s"', (equipment, summary) => {
    expect(equipmentSummary(equipment)).toBe(summary)
  })
})

describe('usageLabel', () => {
  it.each([
    [{ exercises: 3, sets: 46 }, '3 exercises · 46 logged sets'],
    [{ exercises: 1, sets: 1 }, '1 exercise · 1 logged set'],
    [{ exercises: 0, sets: 0 }, 'Not used yet'],
  ])('reads %o as "%s"', (usage, label) => {
    expect(usageLabel(usage)).toBe(label)
  })
})

describe('EquipmentList', () => {
  it('links each piece to its detail and hides archived ones', () => {
    render(<EquipmentList equipment={[smith, { ...legPress, archived: true }]} onNew={vi.fn()} />)

    expect(screen.getByRole('link', { name: /smith machine/i }).getAttribute('href')).toBe(
      '/equipment/q-1',
    )
    expect(screen.queryByText('Leg press')).toBeNull()
  })

  it('offers adding the first piece when there is nothing yet', async () => {
    const onNew = vi.fn()
    render(<EquipmentList equipment={[]} onNew={onNew} />)

    expect(screen.getByText('No equipment yet.')).toBeDefined()
    await userEvent.click(screen.getByRole('button', { name: 'Add your first equipment' }))
    expect(onNew).toHaveBeenCalledOnce()
  })

  it('adds more from the list', async () => {
    const onNew = vi.fn()
    render(<EquipmentList equipment={[smith]} onNew={onNew} />)

    await userEvent.click(screen.getByRole('button', { name: 'New equipment' }))
    expect(onNew).toHaveBeenCalledOnce()
  })
})

describe('EquipmentDetails', () => {
  it('reads the bar weight and how much it is used', () => {
    render(
      <EquipmentDetails equipment={smith} usage={{ exercises: 3, sets: 46 }} onEdit={vi.fn()} />,
    )

    expect(screen.getByText('15 kg')).toBeDefined()
    expect(screen.getByText('3 exercises · 46 logged sets')).toBeDefined()
  })

  it('leads a bar-weight correction to the preview', () => {
    render(<EquipmentDetails equipment={smith} usage={null} onEdit={vi.fn()} />)

    expect(screen.getByRole('link', { name: 'Correct the bar weight…' }).getAttribute('href')).toBe(
      '/equipment/q-1/recompute',
    )
  })

  it('offers no bar correction for a stack', () => {
    render(<EquipmentDetails equipment={legPress} usage={null} onEdit={vi.fn()} />)

    expect(screen.getByText('20 positions')).toBeDefined()
    expect(screen.queryByRole('link', { name: /correct the bar weight/i })).toBeNull()
  })

  it('opens rename and archive', async () => {
    const onEdit = vi.fn()
    render(<EquipmentDetails equipment={smith} usage={null} onEdit={onEdit} />)

    await userEvent.click(screen.getByRole('button', { name: 'Rename or archive' }))

    expect(onEdit).toHaveBeenCalledOnce()
  })
})
