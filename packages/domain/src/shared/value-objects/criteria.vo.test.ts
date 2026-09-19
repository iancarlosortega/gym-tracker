import { describe, expect, it } from 'vitest'
import { Criteria } from './criteria.vo.ts'

interface SampleFields {
  readonly id?: string
  readonly ownerId?: string
  readonly archived?: boolean
}

describe('criteria', () => {
  it('starts empty', () => {
    const criteria = Criteria.none<SampleFields>()
    expect(criteria.isEmpty()).toBe(true)
    expect(criteria.value).toEqual({})
  })

  it('is not empty once a filter is set', () => {
    expect(Criteria.of<SampleFields>({ id: 'a' }).isEmpty()).toBe(false)
  })

  it('reports which filters it carries', () => {
    const criteria = Criteria.of<SampleFields>({ ownerId: 'ian' })
    expect(criteria.has('ownerId')).toBe(true)
    expect(criteria.has('id')).toBe(false)
    expect(criteria.get('ownerId')).toBe('ian')
    expect(criteria.get('id')).toBeUndefined()
  })

  it('treats an explicitly undefined filter as absent', () => {
    const criteria = Criteria.of<SampleFields>({ id: undefined })
    expect(criteria.has('id')).toBe(false)
    expect(criteria.isEmpty()).toBe(true)
  })

  it('narrows by returning a new instance, never mutating', () => {
    const base = Criteria.of<SampleFields>({ ownerId: 'ian' })
    const narrowed = base.with({ archived: false })

    expect(narrowed).not.toBe(base)
    expect(base.has('archived')).toBe(false)
    expect(narrowed.get('archived')).toBe(false)
    expect(narrowed.get('ownerId')).toBe('ian')
  })

  it('drops a filter by returning a new instance', () => {
    const base = Criteria.of<SampleFields>({ ownerId: 'ian', archived: true })
    const relaxed = base.without('archived')

    expect(relaxed.has('archived')).toBe(false)
    expect(base.has('archived')).toBe(true)
  })

  it('cannot be mutated through the object it exposes', () => {
    const criteria = Criteria.of<SampleFields>({ id: 'a' })
    expect(() => {
      ;(criteria.value as { id: string }).id = 'tampered'
    }).toThrow()
    expect(criteria.get('id')).toBe('a')
  })

  it('lists the filter keys it carries', () => {
    expect(Criteria.of<SampleFields>({ id: 'a', archived: true }).keys().sort()).toEqual([
      'archived',
      'id',
    ])
  })
})
