/** A finish the user pressed that the server has not confirmed yet. */
export interface PendingFinish {
  readonly sessionId: string
  /** The moment the user pressed finish, which the server records as the end. */
  readonly finishedAt: Date
}

export interface PendingFinishStore {
  put(finish: PendingFinish): Promise<void>
  all(): Promise<readonly PendingFinish[]>
  delete(sessionId: string): Promise<void>
}
