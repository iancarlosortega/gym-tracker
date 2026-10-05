import {
  createTestDatabase,
  type SeededReferences,
  seedReferences,
} from '@api/database/testing/test-database.js'
import type { PGlite } from '@electric-sql/pglite'
import { beforeEach, describe, expect, it } from 'vitest'

let database: PGlite
let references: SeededReferences

beforeEach(async () => {
  database = await createTestDatabase()
  references = await seedReferences(database)
})

function insertSet(overrides: Record<string, unknown>): Promise<unknown> {
  const row = {
    id: '0199a1f0-0000-7000-8000-00000000a001',
    session_id: references.sessionId,
    exercise_id: references.exerciseId,
    equipment_id: references.barbellId,
    mode: 'PER_SIDE',
    raw_value: 20000,
    raw_unit: 'KG',
    resolved_grams: 60000,
    stack_position: null,
    snapshot_bar_grams: 20000,
    snapshot_display_unit: 'KG',
    reps: 8,
    logged_at: new Date().toISOString(),
    ...overrides,
  }

  const columns = Object.keys(row)
  const placeholders = columns.map((_, index) => `$${index + 1}`)

  return database.query(
    `INSERT INTO logged_set (${columns.join(', ')}) VALUES (${placeholders.join(', ')})`,
    Object.values(row),
  )
}

describe('the logged_set mass/position constraint', () => {
  it('accepts a per-side set carrying a resolved mass', async () => {
    await expect(insertSet({})).resolves.toBeDefined()
  })

  it('accepts an ordinal set carrying a stack position and no mass', async () => {
    await expect(
      insertSet({
        equipment_id: references.machineId,
        mode: 'STACK_POSITION',
        raw_value: 7,
        raw_unit: null,
        resolved_grams: null,
        stack_position: 7,
        snapshot_bar_grams: null,
      }),
    ).resolves.toBeDefined()
  })

  it('REJECTS an ordinal set that claims a mass, which is the statistic-poisoning row', async () => {
    await expect(
      insertSet({
        equipment_id: references.machineId,
        mode: 'STACK_POSITION',
        raw_value: 7,
        raw_unit: null,
        resolved_grams: 35000,
        stack_position: 7,
        snapshot_bar_grams: null,
      }),
    ).rejects.toThrow(/logged_set_mass_xor_position/)
  })

  it('rejects a set carrying neither a mass nor a position', async () => {
    await expect(insertSet({ resolved_grams: null, stack_position: null })).rejects.toThrow(
      /logged_set_mass_xor_position/,
    )
  })

  it('rejects an ordinal set that claims a bar weight', async () => {
    await expect(
      insertSet({
        equipment_id: references.machineId,
        mode: 'STACK_POSITION',
        raw_value: 7,
        raw_unit: null,
        resolved_grams: null,
        stack_position: 7,
        snapshot_bar_grams: 20000,
      }),
    ).rejects.toThrow(/logged_set_ordinal_has_no_bar/)
  })

  it('accepts a per-side set that counts no bar, like a Smith or dumbbells', async () => {
    await expect(insertSet({ snapshot_bar_grams: null })).resolves.toBeDefined()
  })

  it('accepts plate-loaded equipment whose bar is not counted', async () => {
    await expect(
      database.query(
        `INSERT INTO equipment (user_id, name, kind, bar_grams) VALUES ($1, 'Smith machine', 'BARBELL', NULL)`,
        [references.userId],
      ),
    ).resolves.toBeDefined()
  })

  it('rejects a non-positive repetition count', async () => {
    await expect(insertSet({ reps: 0 })).rejects.toThrow(/logged_set_reps_positive/)
  })
})
