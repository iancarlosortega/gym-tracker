import type { MeasurementMode } from '@gym/domain/measurement/value-objects/load-entry.vo'
import { sessionAwareFetch } from '../../auth/infrastructure/session-aware-fetch'

/** The shape the API answers with; the client never rebuilds a domain entity from it. */
export interface WorkoutSessionResponse {
  readonly id: string
  readonly routineId: string | null
  readonly startedAt: string
  readonly finishedAt: string | null
  readonly open: boolean
}

export interface ExerciseResponse {
  readonly id: string
  readonly name: string
  readonly defaultMode: MeasurementMode
  readonly archived: boolean
}

export interface EquipmentResponse {
  readonly id: string
  readonly name: string
  readonly kind: string
  /** Kilograms over the wire; grams are the domain's unit and stay inside it. */
  readonly barKilograms: number | null
  readonly stackPositions: number | null
  readonly archived: boolean
}

interface PageResponse<TItem> {
  readonly items: readonly TItem[]
}

/**
 * Reads the context the logging surface needs.
 *
 * Only reads live here. Writes go through the queue and drain through
 * SetSyncGateway, because a write must work with the API unreachable and a
 * read has nothing useful to say without it.
 */
export class HttpWorkoutGateway {
  constructor(
    private readonly baseUrl: string,
    private readonly fetchImpl: typeof fetch = sessionAwareFetch,
  ) {}

  /** Null when nothing is in progress: the API answers 404 rather than a null body. */
  async currentWorkout(): Promise<WorkoutSessionResponse | null> {
    const response = await this.get('/workouts/current')

    if (response.status === 404) {
      return null
    }
    return (await this.parsed(response)) as WorkoutSessionResponse
  }

  async startWorkout(routineId?: string): Promise<WorkoutSessionResponse> {
    const response = await this.fetchImpl(`${this.baseUrl}/workouts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(routineId === undefined ? {} : { routineId }),
    })

    return (await this.parsed(response)) as WorkoutSessionResponse
  }

  async exercises(): Promise<readonly ExerciseResponse[]> {
    const page = (await this.parsed(
      await this.get('/exercises?limit=200'),
    )) as PageResponse<ExerciseResponse>

    return page.items
  }

  async equipment(): Promise<readonly EquipmentResponse[]> {
    const page = (await this.parsed(
      await this.get('/equipment?limit=200'),
    )) as PageResponse<EquipmentResponse>

    return page.items
  }

  private async get(path: string): Promise<Response> {
    return await this.fetchImpl(`${this.baseUrl}${path}`, { credentials: 'include' })
  }

  private async parsed(response: Response): Promise<unknown> {
    if (!response.ok) {
      throw new Error(`The server answered ${response.status}.`)
    }
    return await response.json()
  }
}
