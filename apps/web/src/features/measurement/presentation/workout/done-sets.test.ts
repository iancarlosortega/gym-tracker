import { LoggedSet } from '@gym/domain/measurement/entities/logged-set.entity'
import { fromKilograms } from '@gym/domain/measurement/value-objects/grams.vo'
import { LoadEntry } from '@gym/domain/measurement/value-objects/load-entry.vo'
import { reps } from '@gym/domain/measurement/value-objects/reps.vo'
import { stackPosition } from '@gym/domain/measurement/value-objects/stack-position.vo'
import { describe, expect, it } from 'vitest'
import { doneRowsFor, fromQueue, fromServer, mergeDone } from './done-sets.ts'

const queued = (id: string, entry: LoadEntry, loggedAt: string, exerciseId = 'e-1') =>
  LoggedSet.create({
    id,
    sessionId: 'w-1',
    exerciseId,
    equipmentId: 'q-1',
    entry,
    reps: reps(8),
    loggedAt: new Date(loggedAt),
    snapshot: {
      barGrams: entry.mode === 'PER_SIDE' ? fromKilograms(20) : null,
      displayUnit: 'KG',
      equipmentId: 'q-1',
    },
  })

describe('done sets', () => {
  it('reads a queued set as the load it resolves to, waiting to sync', () => {
    const set = fromQueue(
      queued(
        's-1',
        LoadEntry.perSide(fromKilograms(20), fromKilograms(20)),
        '2026-10-04T09:05:00Z',
      ),
    )

    expect(set).toMatchObject({ id: 's-1', grams: 60_000, position: null, pending: true })
  })

  it('reads a pin as a position', () => {
    const set = fromQueue(queued('s-1', LoadEntry.stack(stackPosition(7)), '2026-10-04T09:05:00Z'))

    expect(set).toMatchObject({ grams: null, position: 7 })
  })

  it('reads a synced set from the server the same way', () => {
    const set = fromServer({
      id: 's-2',
      sessionId: 'w-1',
      exerciseId: 'e-1',
      equipmentId: 'q-1',
      mode: 'TOTAL',
      reps: 5,
      loggedAt: '2026-10-04T09:10:00.000Z',
      resolvedGrams: 62500,
      stackPosition: null,
    })

    expect(set).toMatchObject({ grams: 62_500, pending: false })
  })

  it('merges server and queue, the queue winning while a set is still in it', () => {
    const server = fromServer({
      id: 's-1',
      sessionId: 'w-1',
      exerciseId: 'e-1',
      equipmentId: 'q-1',
      mode: 'TOTAL',
      reps: 8,
      loggedAt: '2026-10-04T09:05:00.000Z',
      resolvedGrams: 60000,
      stackPosition: null,
    })
    const local = fromQueue(
      queued('s-1', LoadEntry.total(fromKilograms(60)), '2026-10-04T09:05:00Z'),
    )

    expect(mergeDone([server], [local])).toEqual([local])
  })

  it('numbers one exercise’s sets in the order they were logged', () => {
    const sets = [
      fromQueue(queued('b', LoadEntry.total(fromKilograms(60)), '2026-10-04T09:10:00Z')),
      fromQueue(queued('other', LoadEntry.total(fromKilograms(40)), '2026-10-04T09:07:00Z', 'e-2')),
      fromQueue(queued('a', LoadEntry.total(fromKilograms(55)), '2026-10-04T09:05:00Z')),
    ]

    expect(doneRowsFor('e-1', sets, 'KG').map((row) => [row.id, row.setNumber])).toEqual([
      ['a', 1],
      ['b', 2],
    ])
  })

  it('labels each set in the unit the user weighs in', () => {
    const sets = [
      fromQueue(queued('a', LoadEntry.total(fromKilograms(60)), '2026-10-04T09:05:00Z')),
      fromQueue(queued('b', LoadEntry.stack(stackPosition(7)), '2026-10-04T09:06:00Z')),
    ]

    expect(doneRowsFor('e-1', sets, 'KG').map((row) => row.label)).toEqual([
      '60 kg × 8',
      'Pin 7 × 8',
    ])
    expect(doneRowsFor('e-1', sets, 'LB').map((row) => row.label)).toEqual([
      '132.3 lb × 8',
      'Pin 7 × 8',
    ])
  })
})
