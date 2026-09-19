import type { loggedSet } from '@api/database/schema/logged-set.table.js'
import { LoggedSet } from '@gym/domain/measurement/entities/logged-set.entity'
import { type DisplayUnit, grams } from '@gym/domain/measurement/value-objects/grams.vo'
import { LoadEntry } from '@gym/domain/measurement/value-objects/load-entry.vo'
import { reps } from '@gym/domain/measurement/value-objects/reps.vo'
import { stackPosition } from '@gym/domain/measurement/value-objects/stack-position.vo'

type LoggedSetRow = typeof loggedSet.$inferSelect
type LoggedSetInsert = typeof loggedSet.$inferInsert

/**
 * The only place a snake_case column meets a camelCase property.
 *
 * Neither the domain nor the application layer ever sees a column name; if a
 * column is renamed, this file is the whole blast radius.
 */
export const setMapper = {
  toDomain(row: LoggedSetRow): LoggedSet {
    return LoggedSet.restore({
      id: row.id,
      sessionId: row.sessionId,
      exerciseId: row.exerciseId,
      equipmentId: row.equipmentId,
      entry: entryFromRow(row),
      reps: reps(row.reps),
      loggedAt: row.loggedAt,
      snapshot: {
        barGrams: row.snapshotBarGrams === null ? null : grams(row.snapshotBarGrams),
        displayUnit: row.snapshotDisplayUnit as DisplayUnit,
        equipmentId: row.equipmentId,
      },
      revision: row.revision,
    })
  },

  toRow(set: LoggedSet): LoggedSetInsert {
    const state = set.entry.toJSON()
    const mass = set.mass()

    return {
      id: set.id,
      sessionId: set.sessionId,
      exerciseId: set.exerciseId,
      equipmentId: set.equipmentId,
      mode: state.mode,
      rawValue: rawValueOf(state),
      rawUnit: state.mode === 'STACK_POSITION' ? null : set.snapshot.displayUnit,
      resolvedGrams: mass.kind === 'resolved' ? mass.grams : null,
      stackPosition: state.mode === 'STACK_POSITION' ? state.position : null,
      snapshotBarGrams: set.snapshot.barGrams,
      snapshotDisplayUnit: set.snapshot.displayUnit,
      reps: set.reps,
      loggedAt: set.loggedAt,
      revision: set.revision,
    }
  },
}

function rawValueOf(state: ReturnType<LoadEntry['toJSON']>): number {
  switch (state.mode) {
    case 'TOTAL':
      return state.grams
    case 'PER_SIDE':
      return state.perSideGrams
    case 'STACK_POSITION':
      return state.position
  }
}

function entryFromRow(row: LoggedSetRow): LoadEntry {
  switch (row.mode) {
    case 'TOTAL':
      return LoadEntry.total(grams(row.rawValue))
    case 'PER_SIDE':
      return LoadEntry.perSide(grams(row.rawValue), grams(row.snapshotBarGrams ?? 0))
    case 'STACK_POSITION':
      return LoadEntry.stack(stackPosition(row.stackPosition ?? row.rawValue))
  }
}
