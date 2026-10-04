import { sessionAwareFetch } from '../../auth/infrastructure/session-aware-fetch'
export interface WeekSummaryResponse {
  readonly sets: number
  readonly workouts: number
  /** Null when no workout that week followed a routine. */
  readonly plan: { readonly plannedSets: number; readonly completedSets: number } | null
  readonly liftsUp: number
  readonly liftsHeld: number
  readonly liftsDown: number
}

export interface WeekComparisonResponse {
  readonly current: WeekSummaryResponse
  readonly previous: WeekSummaryResponse
}

export interface ProgressionPointResponse {
  readonly periodStart: string
  readonly value: number
  readonly reps: number
  readonly sets: number
  readonly change: 'improved-load' | 'improved-reps' | 'held' | 'declined'
}

export interface ProgressionSeriesResponse {
  readonly mode: string
  readonly unit: 'kilograms' | 'position'
  readonly points: readonly ProgressionPointResponse[]
}

export interface ExerciseProgressionResponse {
  readonly exerciseId: string
  readonly series: readonly ProgressionSeriesResponse[]
  readonly modeChanges: readonly {
    readonly at: string
    readonly from: string
    readonly to: string
  }[]
}

/** Statistics are read-only; nothing here writes. */
export class HttpStatisticsGateway {
  constructor(
    private readonly baseUrl: string,
    private readonly fetchImpl: typeof fetch = sessionAwareFetch,
  ) {}

  async week(weekStart: Date): Promise<WeekComparisonResponse> {
    return (await this.read(
      `/statistics/week?weekStart=${weekStart.toISOString()}`,
    )) as WeekComparisonResponse
  }

  async progression(
    exerciseId: string,
    from: Date,
    to: Date,
  ): Promise<ExerciseProgressionResponse> {
    const query = `from=${from.toISOString()}&to=${to.toISOString()}`

    return (await this.read(
      `/statistics/exercises/${exerciseId}/progression?${query}`,
    )) as ExerciseProgressionResponse
  }

  private async read(path: string): Promise<unknown> {
    const response = await this.fetchImpl(`${this.baseUrl}${path}`, { credentials: 'include' })

    if (!response.ok) {
      throw new Error(`The server answered ${response.status}.`)
    }
    return await response.json()
  }
}
