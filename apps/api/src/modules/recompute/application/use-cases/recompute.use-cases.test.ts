import { Equipment } from '@gym/domain/catalog/entities/equipment.entity'
import { EquipmentNotFoundError } from '@gym/domain/catalog/errors'
import { LoggedSet } from '@gym/domain/measurement/entities/logged-set.entity'
import { fromKilograms } from '@gym/domain/measurement/value-objects/grams.vo'
import { LoadEntry } from '@gym/domain/measurement/value-objects/load-entry.vo'
import { reps } from '@gym/domain/measurement/value-objects/reps.vo'
import { StaleRecomputePreviewError } from '@gym/domain/recompute/errors'
import type { RecomputeDiff } from '@gym/domain/recompute/value-objects/recompute-diff.vo'
import type { DateRange } from '@gym/domain/shared/value-objects/date-range.vo'
import { Id } from '@gym/domain/shared/value-objects/id.vo'
import type { StatisticsRepository } from '@gym/domain/statistics/repositories/statistics.repository'
import { beforeEach, describe, expect, it } from 'vitest'
import { InMemoryEquipmentRepository } from '../../../catalog/testing/in-memory-equipment.repository.ts'
import type { RecomputeAudit } from '../../infrastructure/persistence/recompute-audit.repository.ts'
import { ApplyRecomputeUseCase } from './apply-recompute.use-case.ts'
import { PreviewRecomputeUseCase } from './preview-recompute.use-case.ts'

let counter = 0
const nextId = () => `0199a1f0-0000-7000-8000-${String(++counter).padStart(12, '0')}`

const userId = Id.create()
const otherUserId = Id.create().value

class StubSets implements StatisticsRepository {
  sets: LoggedSet[] = []

  async setsInPeriod(): Promise<readonly LoggedSet[]> {
    return this.sets
  }

  async setsForExercise(): Promise<readonly LoggedSet[]> {
    return this.sets
  }

  async sessionsInPeriod(): Promise<readonly never[]> {
    return []
  }

  async plannedSetsByRoutine(): Promise<ReadonlyMap<string, number>> {
    return new Map()
  }
}

/** Remembers what it was asked to write, and writes nothing. */
class RecordingAudit implements RecomputeAudit {
  readonly applied: RecomputeDiff[] = []

  async apply(_userId: string, diff: RecomputeDiff): Promise<void> {
    this.applied.push(diff)
  }
}

let equipment: InMemoryEquipmentRepository
let sets: StubSets
let audit: RecordingAudit
let preview: PreviewRecomputeUseCase
let apply: ApplyRecomputeUseCase
let barId: string

const perSideSet = (perSideKilograms: number, barKilograms: number): LoggedSet =>
  LoggedSet.create({
    id: nextId(),
    sessionId: 'session',
    exerciseId: 'bench',
    equipmentId: barId,
    entry: LoadEntry.perSide(fromKilograms(perSideKilograms), fromKilograms(barKilograms)),
    reps: reps(5),
    loggedAt: new Date('2026-09-15T10:00:00.000Z'),
    snapshot: {
      barGrams: fromKilograms(barKilograms),
      displayUnit: 'KG',
      equipmentId: barId,
    },
  })

beforeEach(async () => {
  equipment = new InMemoryEquipmentRepository()
  sets = new StubSets()
  audit = new RecordingAudit()

  // Logged against a 20 kg bar; the bar has since been corrected to 15.
  const bar = Equipment.create({
    userId,
    name: 'Olympic bar',
    kind: 'BARBELL',
    barGrams: fromKilograms(20),
  })
  barId = bar.id.value
  await equipment.save(bar.withBarWeight(fromKilograms(15)))

  preview = new PreviewRecomputeUseCase(equipment, sets as unknown as StatisticsRepository)
  apply = new ApplyRecomputeUseCase(preview, audit)
})

describe('previewing a correction', () => {
  it('shows what each set would become, and writes nothing', async () => {
    sets.sets = [perSideSet(20, 20)]

    const diff = await preview.execute({ userId: userId.value, equipmentId: barId })

    expect(diff.changes).toHaveLength(1)
    expect(diff.changes[0]).toMatchObject({
      currentGrams: fromKilograms(60),
      recomputedGrams: fromKilograms(55),
    })
    expect(audit.applied).toHaveLength(0)
  })

  it('refuses equipment belonging to someone else', async () => {
    await expect(preview.execute({ userId: otherUserId, equipmentId: barId })).rejects.toThrow(
      EquipmentNotFoundError,
    )
  })

  it('finds nothing to change when the history already agrees', async () => {
    sets.sets = [perSideSet(20, 15)]

    const diff = await preview.execute({ userId: userId.value, equipmentId: barId })

    expect(diff.changes).toEqual([])
  })
})

describe('applying a correction', () => {
  it('applies exactly the diff that was previewed', async () => {
    sets.sets = [perSideSet(20, 20)]
    const shown = await preview.execute({ userId: userId.value, equipmentId: barId })

    await apply.execute({
      userId: userId.value,
      equipmentId: barId,
      previewToken: shown.token,
    })

    expect(audit.applied).toHaveLength(1)
    expect(audit.applied[0]?.changes).toHaveLength(1)
  })

  it('refuses a token from a preview of different history', async () => {
    sets.sets = [perSideSet(20, 20)]
    const shown = await preview.execute({ userId: userId.value, equipmentId: barId })

    // A set logged between the preview and the confirmation.
    sets.sets = [...sets.sets, perSideSet(30, 20)]

    await expect(
      apply.execute({ userId: userId.value, equipmentId: barId, previewToken: shown.token }),
    ).rejects.toThrow(StaleRecomputePreviewError)
    expect(audit.applied).toHaveLength(0)
  })

  it('refuses a token that was never issued', async () => {
    sets.sets = [perSideSet(20, 20)]

    await expect(
      apply.execute({ userId: userId.value, equipmentId: barId, previewToken: 'invented' }),
    ).rejects.toThrow(StaleRecomputePreviewError)
    expect(audit.applied).toHaveLength(0)
  })

  it('changes nothing when the user simply never confirms', async () => {
    sets.sets = [perSideSet(20, 20)]

    await preview.execute({ userId: userId.value, equipmentId: barId })
    await preview.execute({ userId: userId.value, equipmentId: barId })

    // Declining is doing nothing, and doing nothing must write nothing.
    expect(audit.applied).toHaveLength(0)
  })

  it('writes no audit row when the diff is empty', async () => {
    sets.sets = [perSideSet(20, 15)]
    const shown = await preview.execute({ userId: userId.value, equipmentId: barId })

    await apply.execute({
      userId: userId.value,
      equipmentId: barId,
      previewToken: shown.token,
    })

    expect(audit.applied).toHaveLength(0)
  })
})
