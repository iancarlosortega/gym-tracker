/** @vitest-environment jsdom */
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import type { RecomputePreviewResponse } from '../../infrastructure/recompute.api'
import { RecomputeConsequences } from './recompute-consequences.tsx'

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
    expect(screen.getByText('100')).toBeDefined()
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
