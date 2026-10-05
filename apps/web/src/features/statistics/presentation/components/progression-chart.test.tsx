/** @vitest-environment jsdom */
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import type { ProgressionSeriesResponse } from '../../infrastructure/statistics.api'
import { ProgressionChart } from './progression-chart.tsx'

const point = (value: number, reps: number, week: string) => ({
  periodStart: `2026-09-${week}T00:00:00.000Z`,
  value,
  reps,
  sets: 3,
  change: 'held' as const,
})

const massSeries: ProgressionSeriesResponse = {
  mode: 'TOTAL',
  unit: 'kilograms',
  points: [point(60, 8, '07'), point(60, 10, '14'), point(65, 8, '21')],
}

const ordinalSeries: ProgressionSeriesResponse = {
  mode: 'STACK_POSITION',
  unit: 'position',
  points: [point(5, 10, '07'), point(6, 10, '14'), point(7, 12, '21')],
}

afterEach(cleanup)

describe('ProgressionChart', () => {
  it('says which unit its weights are in', () => {
    render(<ProgressionChart series={massSeries} unit="LB" />)

    expect(screen.getByRole('img').getAttribute('aria-label')).toBe('Weight in lb by week')
  })

  it('draws a mass series as a line, because kilograms are continuous', () => {
    const { container } = render(<ProgressionChart series={massSeries} />)

    expect(container.querySelector('polyline')).not.toBeNull()
    expect(container.querySelector('rect')).toBeNull()
  })

  it('draws an ordinal series as steps, never a slope', () => {
    const { container } = render(<ProgressionChart series={ordinalSeries} />)

    // A line would claim a position of 6.5 exists between two stacks.
    expect(container.querySelectorAll('rect')).toHaveLength(3)
    expect(container.querySelector('polyline')).toBeNull()
  })

  it('prints the reps of every top set', () => {
    render(<ProgressionChart series={massSeries} />)

    expect(screen.getByText('10 reps')).toBeDefined()
  })

  it('names the scale it is drawing', () => {
    render(<ProgressionChart series={ordinalSeries} />)

    expect(screen.getByRole('img', { name: 'Pin position by week' })).toBeDefined()
  })

  it('says nothing rather than drawing an empty chart', () => {
    render(<ProgressionChart series={{ ...massSeries, points: [] }} />)

    expect(screen.getByText('Nothing logged in this period.')).toBeDefined()
  })
})
