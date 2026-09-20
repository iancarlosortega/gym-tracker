export interface SetChangeResponse {
  readonly setId: string
  readonly exerciseId: string
  readonly loggedAt: string
  readonly fromKilograms: number
  readonly toKilograms: number
}

export interface RecordChangeResponse {
  readonly exerciseId: string
  readonly fromKilograms: number
  readonly toKilograms: number
  readonly holderSetId: string
}

export interface RecomputePreviewResponse {
  readonly equipmentId: string
  readonly affectedSets: number
  readonly changes: readonly SetChangeResponse[]
  readonly records: readonly RecordChangeResponse[]
  readonly previewToken: string
}

/** Thrown when the server refuses a token whose history has since moved. */
export class StalePreviewError extends Error {
  constructor() {
    super('This history has changed since that preview.')
    this.name = 'StalePreviewError'
  }
}

export class HttpRecomputeGateway {
  constructor(
    private readonly baseUrl: string,
    private readonly fetchImpl: typeof fetch = globalThis.fetch,
  ) {}

  async preview(equipmentId: string): Promise<RecomputePreviewResponse> {
    return await this.send(`/equipment/${equipmentId}/recompute/preview`)
  }

  /**
   * Apply exactly the change that was previewed.
   *
   * A 409 means the history moved underneath the preview. It is a distinct
   * error rather than a generic failure because it has its own answer —
   * look again — and telling the user "something went wrong" would hide the
   * one fact that explains it.
   */
  async apply(equipmentId: string, previewToken: string): Promise<RecomputePreviewResponse> {
    return await this.send(`/equipment/${equipmentId}/recompute/apply`, { previewToken })
  }

  private async send(path: string, body?: unknown): Promise<RecomputePreviewResponse> {
    const response = await this.fetchImpl(`${this.baseUrl}${path}`, {
      method: 'POST',
      credentials: 'include',
      ...(body === undefined
        ? {}
        : { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }),
    })

    if (response.status === 409) {
      throw new StalePreviewError()
    }

    if (!response.ok) {
      throw new Error(`The server answered ${response.status}.`)
    }

    return (await response.json()) as RecomputePreviewResponse
  }
}
