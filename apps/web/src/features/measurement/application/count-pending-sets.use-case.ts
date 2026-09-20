import type { SetRepository } from '@gym/domain/measurement/repositories/set.repository'
import { Criteria } from '@gym/domain/shared/value-objects/criteria.vo'

/**
 * How many sets the server has not confirmed yet.
 *
 * The queue holds pending writes only, so its size is the answer — there is
 * no separate flag to keep in step with it. The spec requires the user can
 * see this number, and a count that is derived cannot drift from the thing
 * it counts.
 */
export class CountPendingSetsUseCase {
  constructor(private readonly queue: SetRepository) {}

  async execute(): Promise<number> {
    return await this.queue.count(Criteria.none())
  }
}
