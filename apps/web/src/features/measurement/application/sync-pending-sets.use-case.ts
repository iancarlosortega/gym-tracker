import type { LoggedSet } from '@gym/domain/measurement/entities/logged-set.entity'
import type { SetSyncGateway } from '@gym/domain/measurement/ports/set-sync.gateway'
import type { SetRepository } from '@gym/domain/measurement/repositories/set.repository'
import { Criteria } from '@gym/domain/shared/value-objects/criteria.vo'
import { Pagination } from '@gym/domain/shared/value-objects/pagination.vo'

/** Matches the server's batch bound, so a drained page is always deliverable. */
const BATCH_SIZE = 100

export interface SyncPendingSetsResult {
  /** Sets the server took responsibility for, now gone from the queue. */
  readonly confirmed: number
  /** Sets still queued: rejected, unacknowledged, or never attempted. */
  readonly pending: number
}

/**
 * Drain the offline queue into the server.
 *
 * Nothing leaves the queue on optimism. A set is deleted only once the server
 * has named it as received, so a transmission that fails halfway — or
 * succeeds while its response is lost on the way back — leaves the set
 * exactly where it was, to be sent again. The cost of that is a duplicate
 * delivery, which the client-generated id makes free.
 *
 * Sets are grouped by session because that is how the endpoint takes them,
 * and a failure in one session does not hold up another.
 */
export class SyncPendingSetsUseCase {
  constructor(
    private readonly queue: SetRepository,
    private readonly gateway: SetSyncGateway,
  ) {}

  async execute(): Promise<SyncPendingSetsResult> {
    const pending = await this.pendingSets()
    let confirmed = 0

    for (const [sessionId, sets] of groupBySession(pending)) {
      for (const batch of chunked(sets, BATCH_SIZE)) {
        confirmed += await this.deliver(sessionId, batch)
      }
    }

    return { confirmed, pending: await this.queue.count(Criteria.none()) }
  }

  /**
   * A failed delivery is not an error here.
   *
   * Losing connectivity mid-drain is ordinary, and the queue is already the
   * record of what still has to go. Throwing would only tell the caller what
   * the returned pending count already says.
   */
  private async deliver(sessionId: string, batch: readonly LoggedSet[]): Promise<number> {
    let accepted: readonly string[]

    try {
      accepted = await this.gateway.push(sessionId, batch)
    } catch {
      return 0
    }

    const delivered = new Set(accepted)

    for (const set of batch) {
      if (delivered.has(set.id)) {
        await this.queue.delete(set.id)
      }
    }

    return batch.filter((set) => delivered.has(set.id)).length
  }

  /** The queue holds pending writes only, so everything in it is to be sent. */
  private async pendingSets(): Promise<readonly LoggedSet[]> {
    const collected: LoggedSet[] = []
    let window = Pagination.create({ limit: BATCH_SIZE })

    for (;;) {
      const page = await this.queue.findMany(Criteria.none(), window)
      collected.push(...page.items)

      if (!page.hasMore) {
        return collected
      }
      window = window.next()
    }
  }
}

function groupBySession(sets: readonly LoggedSet[]): Map<string, LoggedSet[]> {
  const grouped = new Map<string, LoggedSet[]>()

  for (const set of sets) {
    const existing = grouped.get(set.sessionId)

    if (existing === undefined) {
      grouped.set(set.sessionId, [set])
    } else {
      existing.push(set)
    }
  }

  return grouped
}

function chunked<TItem>(items: readonly TItem[], size: number): TItem[][] {
  const chunks: TItem[][] = []

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size))
  }

  return chunks
}
