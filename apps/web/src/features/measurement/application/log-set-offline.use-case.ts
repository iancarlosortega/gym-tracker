import {
  LoggedSet,
  type ResolutionSnapshot,
} from '@gym/domain/measurement/entities/logged-set.entity'
import type { SetRepository } from '@gym/domain/measurement/repositories/set.repository'
import type { LoadEntry } from '@gym/domain/measurement/value-objects/load-entry.vo'
import { reps } from '@gym/domain/measurement/value-objects/reps.vo'
import { Id } from '@gym/domain/shared/value-objects/id.vo'
import { QueueWriteFailedError } from './queue-write-failed.error.js'

export interface LogSetOfflineInput {
  readonly sessionId: string
  readonly exerciseId: string
  readonly equipmentId: string
  readonly entry: LoadEntry
  readonly reps: number
  readonly snapshot: ResolutionSnapshot
  readonly loggedAt: Date
}

/**
 * Record a set on the device.
 *
 * The id is generated here, at log time, and never by the server. That is
 * what makes delivery idempotent: the set carries the same identity on its
 * first attempt and on every retry, so a lost acknowledgement costs one
 * duplicate request and no duplicate row. UUIDv7 rather than v4 because it
 * is time-ordered, which keeps the queue in the order it was written.
 *
 * The mass is resolved on the device too. The user sees the number they
 * lifted whether or not there is a signal in the building — that is the
 * whole reason the domain is a shared package.
 *
 * A storage failure is raised, never swallowed. Everything else here is
 * built to survive a lost network, but a set that could not even be written
 * to the device is gone, and the user has to be told while they still
 * remember what they lifted.
 */
export class LogSetOfflineUseCase {
  constructor(private readonly sets: SetRepository) {}

  async execute(input: LogSetOfflineInput): Promise<LoggedSet> {
    const set = LoggedSet.create({
      id: Id.createAt(input.loggedAt).value,
      sessionId: input.sessionId,
      exerciseId: input.exerciseId,
      equipmentId: input.equipmentId,
      entry: input.entry,
      reps: reps(input.reps),
      loggedAt: input.loggedAt,
      snapshot: input.snapshot,
    })

    try {
      await this.sets.save(set)
    } catch (failure) {
      throw new QueueWriteFailedError(failure)
    }

    return set
  }
}
