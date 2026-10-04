import { describe, expect, it } from 'vitest'
import {
  compatibleEquipment,
  defaultEquipmentId,
  kindsFor,
  lastTimeState,
  logBlocker,
  workoutOrder,
} from './workout-plan.ts'

const equipment = [
  {
    id: 'bar',
    name: 'Olympic bar',
    kind: 'BARBELL',
    barKilograms: 20,
    stackPositions: null,
    archived: false,
  },
  {
    id: 'stack',
    name: 'Leg press',
    kind: 'STACK',
    barKilograms: null,
    stackPositions: 20,
    archived: false,
  },
  {
    id: 'dumbbells',
    name: 'Dumbbells',
    kind: 'FREE_WEIGHT',
    barKilograms: null,
    stackPositions: null,
    archived: false,
  },
]

describe('compatibleEquipment', () => {
  it('follows what each kind can measure', () => {
    expect(compatibleEquipment('PER_SIDE', equipment).map((item) => item.id)).toEqual(['bar'])
    expect(compatibleEquipment('STACK_POSITION', equipment).map((item) => item.id)).toEqual([
      'stack',
    ])
    expect(compatibleEquipment('TOTAL', equipment).map((item) => item.id)).toEqual([
      'bar',
      'dumbbells',
    ])
  })
})

describe('defaultEquipmentId', () => {
  const total = compatibleEquipment('TOTAL', equipment)

  it('prefers what the plan names, when it fits', () => {
    expect(
      defaultEquipmentId({ planned: 'dumbbells', usedEarlier: 'bar', compatible: total }),
    ).toBe('dumbbells')
  })

  it('then what this workout already used for the exercise', () => {
    expect(defaultEquipmentId({ planned: 'stack', usedEarlier: 'bar', compatible: total })).toBe(
      'bar',
    )
  })

  it('then the only equipment that fits', () => {
    expect(
      defaultEquipmentId({
        planned: null,
        usedEarlier: null,
        compatible: compatibleEquipment('PER_SIDE', equipment),
      }),
    ).toBe('bar')
  })

  it('leaves the choice to the user when several fit', () => {
    expect(defaultEquipmentId({ planned: null, usedEarlier: null, compatible: total })).toBeNull()
  })
})

describe('workoutOrder', () => {
  it('follows the routine, then adds exercises logged outside it', () => {
    const plan = [
      { exerciseId: 'squat', position: 2 },
      { exerciseId: 'press', position: 1 },
    ]

    expect(workoutOrder(plan, ['curl', 'press', 'curl'])).toEqual(['press', 'squat', 'curl'])
  })

  it('is the order exercises were added in an empty workout', () => {
    expect(workoutOrder(null, ['curl', 'row', 'curl'])).toEqual(['curl', 'row'])
  })
})

describe('lastTimeState', () => {
  const last = {
    sessionStartedAt: '2026-09-28T09:00:00.000Z',
    sets: [
      { setNumber: 1, mode: 'PER_SIDE' as const, value: 20, reps: 8 },
      { setNumber: 2, mode: 'PER_SIDE' as const, value: 20, reps: 7 },
    ],
  }

  it('shows the same set number from last time', () => {
    expect(lastTimeState({ data: last, offline: false }, 2)).toEqual({
      kind: 'value',
      set: last.sets[1],
    })
  })

  it('says when there was no such set last time', () => {
    expect(lastTimeState({ data: last, offline: false }, 4)).toEqual({
      kind: 'no-set',
      setNumber: 4,
    })
  })

  it('says when the exercise was never done', () => {
    expect(lastTimeState({ data: null, offline: false }, 1)).toEqual({ kind: 'none' })
  })

  it('says it is offline when nothing was read before', () => {
    expect(lastTimeState({ data: undefined, offline: true }, 1)).toEqual({ kind: 'offline' })
  })

  it('is loading while the first read is on its way', () => {
    expect(lastTimeState({ data: undefined, offline: false }, 1)).toEqual({ kind: 'loading' })
  })
})

describe('kindsFor', () => {
  it('names the kinds of equipment that can measure each mode', () => {
    expect(kindsFor('PER_SIDE')).toEqual(['BARBELL'])
    expect(kindsFor('STACK_POSITION')).toEqual(['STACK'])
    expect(kindsFor('TOTAL')).toEqual(['BARBELL', 'FREE_WEIGHT'])
  })
})

describe('logBlocker', () => {
  it('names the first thing missing before a set can be logged', () => {
    expect(logBlocker({ equipment: false, weight: 30, reps: 8 })).toBe(
      'Pick the equipment to log this set.',
    )
    expect(logBlocker({ equipment: true, weight: null, reps: 8 })).toBe(
      'Enter the weight to log this set.',
    )
    expect(logBlocker({ equipment: true, weight: 30, reps: null })).toBe(
      'Enter the reps to log this set.',
    )
    expect(logBlocker({ equipment: true, weight: 30, reps: 0 })).toBe(
      'Enter the reps to log this set.',
    )
  })

  it('is nothing once the set is complete', () => {
    expect(logBlocker({ equipment: true, weight: 30, reps: 8 })).toBeNull()
  })
})
