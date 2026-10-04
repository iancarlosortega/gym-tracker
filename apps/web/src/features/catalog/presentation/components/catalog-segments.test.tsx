/** @vitest-environment jsdom */
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { CatalogSegments, currentSegment } from './catalog-segments.tsx'

afterEach(cleanup)

describe('currentSegment', () => {
  it.each([
    ['/routines', 'routines'],
    ['/routines/r-1', 'routines'],
    ['/exercises', 'exercises'],
    ['/equipment', 'equipment'],
    ['/equipment/q-1', 'equipment'],
  ])('reads %s as %s', (pathname, segment) => {
    expect(currentSegment(pathname)).toBe(segment)
  })
})

describe('CatalogSegments', () => {
  it('links the three areas, one tap each', () => {
    render(<CatalogSegments pathname="/exercises" />)

    expect(screen.getByRole('link', { name: 'Routines' }).getAttribute('href')).toBe('/routines')
    expect(screen.getByRole('link', { name: 'Exercises' }).getAttribute('href')).toBe('/exercises')
    expect(screen.getByRole('link', { name: 'Equipment' }).getAttribute('href')).toBe('/equipment')
  })

  it('marks only the area being shown', () => {
    render(<CatalogSegments pathname="/equipment/q-1" />)

    expect(screen.getByRole('link', { name: 'Equipment' }).getAttribute('aria-current')).toBe(
      'page',
    )
    expect(screen.getByRole('link', { name: 'Exercises' }).hasAttribute('aria-current')).toBe(false)
  })
})
