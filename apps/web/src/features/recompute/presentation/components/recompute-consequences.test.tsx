/** @vitest-environment jsdom */
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import type { RecomputePreviewResponse } from '../../infrastructure/recompute.api'
import { RecomputeConsequences, SetChangeList } from './recompute-consequences.tsx'

const names = new Map([['bench', 'Bench press']])

const preview = (overrides: Partial<RecomputePreviewResponse> = {}): RecomputePreviewResponse => ({
  equipmentId: 'bar',
  affectedSets: 42,
  changes: [],
  records: [{ exerciseId: 'bench', fromKilograms: 100, toKilograms: 95, holderSetId: 'set-1' }],
  previewToken: 'token',
  ...overrides,
})

afterEach(cleanup)

describe('RecomputeConsequences', () => {
  it('leads with the record that changes, not the set count', () => {
    render(<RecomputeConsequences exerciseNames={names} preview={preview()} />)

    expect(screen.getByText('Your Bench press record')).toBeDefined()
    expect(screen.getByText('100 kg')).toBeDefined()
    expect(screen.getByText('95 kg')).toBeDefined()
  })

  it('says outright that the old figure was never true', () => {
    render(<RecomputeConsequences exerciseNames={names} preview={preview()} />)

    expect(screen.getByText(/It was never 100/)).toBeDefined()
  })

  it('states that nothing is deleted, which is the reassurance that matters', () => {
    render(<RecomputeConsequences exerciseNames={names} preview={preview()} />)

    expect(screen.getByText(/sets are deleted\. Your reps and dates are untouched\./)).toBeDefined()
  })

  it('counts the affected sets', () => {
    render(<RecomputeConsequences exerciseNames={names} preview={preview()} />)

    expect(screen.getByText('42')).toBeDefined()
  })

  it('says so plainly when no record moves', () => {
    render(<RecomputeConsequences exerciseNames={names} preview={preview({ records: [] })} />)

    expect(screen.getByText('No personal record changes')).toBeDefined()
    expect(screen.queryByText(/It was never/)).toBeNull()
  })

  it('reads as one exercise rather than exercises when only one moved', () => {
    render(<RecomputeConsequences exerciseNames={names} preview={preview()} />)

    expect(screen.getByText(/exercise shows lower numbers/)).toBeDefined()
  })
})

describe('recompute in pounds', () => {
  it('reads the record in pounds on both sides', () => {
    render(<RecomputeConsequences exerciseNames={names} preview={preview()} unit="LB" />)

    expect(screen.getByText('220.5 lb')).toBeDefined()
    expect(screen.getByText('209.4 lb')).toBeDefined()
    expect(screen.getByText(/It was never 220\.5 lb/)).toBeDefined()
  })

  it('names the unit on both sides of every changed set', () => {
    render(
      <SetChangeList
        exerciseNames={names}
        unit="LB"
        changes={[
          {
            setId: 's-1',
            exerciseId: 'bench',
            loggedAt: '2026-09-28T09:00:00.000Z',
            fromKilograms: 60,
            toKilograms: 55,
          },
        ]}
      />,
    )

    expect(screen.getByText('132.3 lb')).toBeDefined()
    expect(screen.getByText('121.3 lb')).toBeDefined()
  })
})
