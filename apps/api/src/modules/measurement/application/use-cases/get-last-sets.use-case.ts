import { LAST_SETS_REPOSITORY } from '@api/modules/measurement/measurement.tokens.js'
import type { LoggedSet } from '@gym/domain/measurement/entities/logged-set.entity'
import type { LastSetsRepository } from '@gym/domain/measurement/repositories/last-sets.repository'
import { toKilograms } from '@gym/domain/measurement/value-objects/grams.vo'
import type { MeasurementMode } from '@gym/domain/measurement/value-objects/load-entry.vo'
import { Inject, Injectable } from '@nestjs/common'

export interface GetLastSetsInput {
  readonly userId: string
  readonly exerciseId: string
  /** The session being logged, which "last time" must not echo. */
  readonly excludingSessionId: string | null
}

export interface LastSet {
  readonly setNumber: number
  readonly mode: MeasurementMode
  /** As it was entered: total kilograms, kilograms per side, or the pin position. */
  readonly value: number
  readonly reps: number
}

export interface LastSets {
  readonly sessionStartedAt: Date
  readonly sets: readonly LastSet[]
}

@Injectable()
export class GetLastSetsUseCase {
  constructor(@Inject(LAST_SETS_REPOSITORY) private readonly lastSets: LastSetsRepository) {}

  async execute(input: GetLastSetsInput): Promise<LastSets | null> {
    const last = await this.lastSets.lastSession(
      input.userId,
      input.exerciseId,
      input.excludingSessionId,
    )
    if (last === null) return null

    return {
      sessionStartedAt: last.sessionStartedAt,
      sets: last.sets.map((set, index) => ({
        setNumber: index + 1,
        mode: set.entry.mode,
        value: enteredValue(set),
        reps: set.reps,
      })),
    }
  }
}

const enteredValue = (set: LoggedSet): number => {
  const state = set.entry.toJSON()
  switch (state.mode) {
    case 'TOTAL':
      return toKilograms(state.grams)
    case 'PER_SIDE':
      return toKilograms(state.perSideGrams)
    case 'STACK_POSITION':
      return state.position
  }
}
