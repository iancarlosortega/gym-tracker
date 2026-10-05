import { describe, expect, it } from 'vitest'
import { Id } from '../../shared/value-objects/id.vo.ts'
import { Routine } from '../entities/routine.entity.ts'
import { RoutinesOrderMismatchError } from '../errors.ts'
import { nextRoutinePosition, reorderRoutines } from './routine-order.service.ts'

const userId = Id.create()
const routine = (name: string, position: number) => Routine.create({ userId, name, position })

describe('reordering routines', () => {
  it('gives each routine its place in the order named', () => {
    const legs = routine('Legs', 0)
    const pull = routine('Pull day', 1)
    const push = routine('Push day', 2)

    const reordered = reorderRoutines([legs, pull, push], [push.id, legs.id, pull.id])

    expect(reordered.map((each) => [each.name.value, each.position])).toEqual([
      ['Push day', 0],
      ['Legs', 1],
      ['Pull day', 2],
    ])
  })

  it('refuses an order that leaves a routine out', () => {
    const legs = routine('Legs', 0)
    const push = routine('Push day', 1)

    expect(() => reorderRoutines([legs, push], [push.id])).toThrow(RoutinesOrderMismatchError)
  })

  it('refuses an order that names a routine twice or one that is not there', () => {
    const legs = routine('Legs', 0)
    const push = routine('Push day', 1)

    expect(() => reorderRoutines([legs, push], [push.id, push.id])).toThrow(
      RoutinesOrderMismatchError,
    )
    expect(() => reorderRoutines([legs, push], [push.id, Id.create()])).toThrow(
      RoutinesOrderMismatchError,
    )
  })
})

describe('a new routine', () => {
  it('goes after every routine there is', () => {
    expect(nextRoutinePosition([routine('Legs', 0), routine('Push day', 4)])).toBe(5)
  })

  it('goes first when there are none', () => {
    expect(nextRoutinePosition([])).toBe(0)
  })
})
