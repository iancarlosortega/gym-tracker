import { Equipment } from '@domain/catalog/entities/equipment.entity.js'
import { LoggedSet } from '@domain/measurement/entities/logged-set.entity.js'
import { fromKilograms } from '@domain/measurement/value-objects/grams.vo.js'
import { LoadEntry } from '@domain/measurement/value-objects/load-entry.vo.js'
import { reps } from '@domain/measurement/value-objects/reps.vo.js'
import { stackPosition } from '@domain/measurement/value-objects/stack-position.vo.js'
import { recomputeFor } from '@domain/recompute/services/recompute.service.js'
import { Id } from '@domain/shared/value-objects/id.vo.js'
import { describe, expect, it } from 'vitest'

let counter = 0
const nextId = () => `0199a1f0-0000-7000-8000-${String(++counter).padStart(12, '0')}`

const userId = Id.create()
const loggedAt = new Date('2026-09-15T10:00:00.000Z')

/** The bar was recorded as 20 kg and is really 15. */
const correctedBar = Equipment.create({
  userId,
  name: 'Olympic bar',
  kind: 'BARBELL',
  barGrams: fromKilograms(15),
}).withBarWeight(fromKilograms(15))

const machine = Equipment.create({
  userId,
  name: 'Pulldown',
  kind: 'STACK',
  stackPositions: 12,
})

const tokenOf = (changes: readonly { readonly setId: string }[]) =>
  changes.map((change) => change.setId).join('|')

const perSideSet = (
  perSideKilograms: number,
  barKilograms: number,
  exerciseId = 'bench',
  equipmentId = correctedBar.id.value,
): LoggedSet =>
  LoggedSet.create({
    id: nextId(),
    sessionId: 'session',
    exerciseId,
    equipmentId,
    entry: LoadEntry.perSide(fromKilograms(perSideKilograms), fromKilograms(barKilograms)),
    reps: reps(5),
    loggedAt,
    snapshot: {
      barGrams: fromKilograms(barKilograms),
      displayUnit: 'KG',
      equipmentId,
    },
  })

const totalSet = (kilograms: number): LoggedSet =>
  LoggedSet.create({
    id: nextId(),
    sessionId: 'session',
    exerciseId: 'bench',
    equipmentId: correctedBar.id.value,
    entry: LoadEntry.total(fromKilograms(kilograms)),
    reps: reps(5),
    loggedAt,
    snapshot: { barGrams: null, displayUnit: 'KG', equipmentId: correctedBar.id.value },
  })

const plateSet = (): LoggedSet =>
  LoggedSet.create({
    id: nextId(),
    sessionId: 'session',
    exerciseId: 'pulldown',
    equipmentId: machine.id.value,
    entry: LoadEntry.stack(stackPosition(7)),
    reps: reps(10),
    loggedAt,
    snapshot: { barGrams: null, displayUnit: 'KG', equipmentId: machine.id.value },
  })

describe('what a corrected bar would change', () => {
  it('recomputes a per-side set against the corrected bar', () => {
    // 20 a side on a 20 bar was 60; on a 15 bar it is 55.
    const diff = recomputeFor(correctedBar, [perSideSet(20, 20)], tokenOf)

    expect(diff.changes).toHaveLength(1)
    expect(diff.changes[0]).toMatchObject({
      currentGrams: fromKilograms(60),
      recomputedGrams: fromKilograms(55),
    })
  })

  it('recomputes past sets when the bar stops being counted, as on a Smith', () => {
    // 20 a side on a 15 bar was 55; with the bar not counted it is 40.
    const smith = correctedBar.withBarWeight(null)

    const diff = recomputeFor(smith, [perSideSet(20, 15)], tokenOf)

    expect(diff.changes[0]).toMatchObject({
      currentGrams: fromKilograms(55),
      recomputedGrams: fromKilograms(40),
    })
  })

  it('leaves a set that already agrees with the corrected bar alone', () => {
    const diff = recomputeFor(correctedBar, [perSideSet(20, 15)], tokenOf)

    expect(diff.changes).toEqual([])
  })

  it('never touches a TOTAL set, which owes nothing to the bar', () => {
    expect(recomputeFor(correctedBar, [totalSet(60)], tokenOf).changes).toEqual([])
  })

  it('never touches an ordinal set, which holds no mass to recompute', () => {
    expect(recomputeFor(machine, [plateSet()], tokenOf).changes).toEqual([])
  })

  it('leaves sets logged against other equipment alone', () => {
    const otherBar = perSideSet(20, 20, 'bench', Id.create().value)

    expect(recomputeFor(correctedBar, [otherBar], tokenOf).changes).toEqual([])
  })

  it('counts every affected set', () => {
    const diff = recomputeFor(correctedBar, [perSideSet(20, 20), perSideSet(30, 20)], tokenOf)

    expect(diff.changes).toHaveLength(2)
  })
})

describe('records that would change hands', () => {
  it('reports a best lift whose value moves', () => {
    const diff = recomputeFor(correctedBar, [perSideSet(20, 20)], tokenOf)

    expect(diff.records).toEqual([
      {
        exerciseId: 'bench',
        currentGrams: fromKilograms(60),
        recomputedGrams: fromKilograms(55),
        holderSetId: diff.changes[0]?.setId,
      },
    ])
  })

  it('says nothing about an exercise whose best did not move', () => {
    // The heavier set is a TOTAL and is untouched, so it still holds the record.
    const diff = recomputeFor(correctedBar, [totalSet(100), perSideSet(20, 20)], tokenOf)

    expect(diff.records).toEqual([])
  })
})

describe('the token', () => {
  it('is derived from the diff, so the same diff yields the same token', () => {
    const sets = [perSideSet(20, 20)]

    expect(recomputeFor(correctedBar, sets, tokenOf).token).toBe(
      recomputeFor(correctedBar, sets, tokenOf).token,
    )
  })

  it('changes when a further set joins the diff', () => {
    const first = recomputeFor(correctedBar, [perSideSet(20, 20)], tokenOf)
    const second = recomputeFor(correctedBar, [perSideSet(20, 20), perSideSet(30, 20)], tokenOf)

    expect(second.token).not.toBe(first.token)
  })
})
