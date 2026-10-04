import { describe, expect, it } from 'vitest'
import { safeNextPath, signInPathFor } from './sign-in-redirect.ts'

describe('safeNextPath', () => {
  it('keeps a same-origin path, query and all', () => {
    expect(safeNextPath('/statistics/abc?weeks=12')).toBe('/statistics/abc?weeks=12')
  })

  it('falls back to home when there is nothing to follow', () => {
    expect(safeNextPath(undefined)).toBe('/')
    expect(safeNextPath(null)).toBe('/')
    expect(safeNextPath('')).toBe('/')
  })

  it.each([
    'https://evil.example',
    '//evil.example',
    '/\\evil.example',
    '\\\\evil.example',
    'evil.example',
    'javascript:alert(1)',
    '/\t/evil.example',
    '/ok\nLocation: x',
  ])('refuses %j, which would leave the origin or smuggle a header', (next) => {
    expect(safeNextPath(next)).toBe('/')
  })

  it('never returns to the sign-in page, which would loop', () => {
    expect(safeNextPath('/sign-in')).toBe('/')
    expect(safeNextPath('/sign-in?next=%2Fworkout')).toBe('/')
  })
})

describe('signInPathFor', () => {
  it('carries the current page, encoded', () => {
    expect(signInPathFor('/workout?a=1&b=2')).toBe('/sign-in?next=%2Fworkout%3Fa%3D1%26b%3D2')
  })

  it('round-trips through the sanitizer', () => {
    const next = new URL(signInPathFor('/statistics/x?y=1'), 'http://h').searchParams.get('next')

    expect(safeNextPath(next)).toBe('/statistics/x?y=1')
  })
})
