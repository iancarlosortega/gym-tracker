import type { LoggedSet } from '@gym/domain/measurement/entities/logged-set.entity'
import type { SetSyncGateway } from '@gym/domain/measurement/ports/set-sync.gateway'
import { type AxiosInstance, isAxiosError } from 'axios'
import { apiClient } from '@/lib/api-client'
import { WorkoutGoneError } from '../application/workout-gone.error'

interface LoggedSetResponse {
  readonly id: string
}

/**
 * Delivers queued sets to the API.
 *
 * The confirmation is read from the response body rather than the status
 * code: the server answers with the sets it wrote, so a partial acceptance
 * names itself and the queue keeps whatever is missing. A non-2xx response or
 * a dead connection throws, and the caller treats that as "still pending",
 * except a 404: the workout is gone, and that is said with its own error.
 */
export class HttpSetSyncGateway implements SetSyncGateway {
  constructor(private readonly client: AxiosInstance = apiClient) {}

  async push(sessionId: string, sets: readonly LoggedSet[]): Promise<readonly string[]> {
    try {
      const { data: written } = await this.client.post<readonly LoggedSetResponse[]>(
        `/workouts/${sessionId}/sets`,
        { sets: sets.map(toRequest) },
      )
      return written.map((set) => set.id)
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 404) {
        throw new WorkoutGoneError(sessionId)
      }
      throw error
    }
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
