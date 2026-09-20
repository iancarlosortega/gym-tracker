import type { LoggedSet } from '@gym/domain/measurement/entities/logged-set.entity'
import type { SetSyncGateway } from '@gym/domain/measurement/ports/set-sync.gateway'

interface LoggedSetResponse {
  readonly id: string
}

/**
 * Delivers queued sets to the API.
 *
 * The confirmation is read from the response body rather than the status
 * code: the server answers with the sets it wrote, so a partial acceptance
 * names itself and the queue keeps whatever is missing. A non-2xx response or
 * a dead connection throws, and the caller treats that as "still pending".
 */
export class HttpSetSyncGateway implements SetSyncGateway {
  constructor(
    private readonly baseUrl: string,
    private readonly fetchImpl: typeof fetch = globalThis.fetch,
  ) {}

  async push(sessionId: string, sets: readonly LoggedSet[]): Promise<readonly string[]> {
    const response = await this.fetchImpl(`${this.baseUrl}/workouts/${sessionId}/sets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // The session lives in a cookie, and the queue drains cross-origin.
      credentials: 'include',
      body: JSON.stringify({ sets: sets.map(toRequest) }),
    })

    if (!response.ok) {
      throw new Error(`The server refused the batch with ${response.status}.`)
    }

    const written = (await response.json()) as readonly LoggedSetResponse[]
    return written.map((set) => set.id)
  }
}

function toRequest(set: LoggedSet): Record<string, unknown> {
  const state = set.entry.toJSON()

  return {
    id: set.id,
    exerciseId: set.exerciseId,
    equipmentId: set.equipmentId,
    grams:
      state.mode === 'TOTAL'
        ? state.grams
        : state.mode === 'PER_SIDE'
          ? state.perSideGrams
          : undefined,
    position: state.mode === 'STACK_POSITION' ? state.position : undefined,
    reps: set.reps,
    loggedAt: set.loggedAt.toISOString(),
  }
}
