import { CLOCK, ROUTINE_REPOSITORY } from '@api/modules/routines/routines.tokens.js'
import type { Clock } from '@gym/domain/auth/ports/clock.port'
import type { Routine } from '@gym/domain/routines/entities/routine.entity'
import type { RoutineRepository } from '@gym/domain/routines/repositories/routine.repository'
import { Inject, Injectable } from '@nestjs/common'
import { findOwnedRoutine } from './find-routine.js'

export interface ArchiveRoutineInput {
  readonly userId: string
  readonly routineId: string
}

@Injectable()
export class ArchiveRoutineUseCase {
  constructor(
    @Inject(ROUTINE_REPOSITORY) private readonly routines: RoutineRepository,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  /** Archiving hides a routine; sessions already completed from it are untouched. */
  async execute(input: ArchiveRoutineInput): Promise<Routine> {
    const routine = await findOwnedRoutine(this.routines, input.userId, input.routineId)
    const archived = routine.archivedAt(this.clock.now())

    await this.routines.save(archived)
    return archived
  }
}
