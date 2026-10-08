/**
 * Leave the account on this phone.
 *
 * The server goes first: if the session cannot be ended, nothing local is
 * thrown away and the user stays where they are, rather than landing on
 * sign-in with a cookie that still works. What the session read is forgotten
 * on arriving at sign-in, once nothing signed-in is still on screen to read it
 * again. The offline queue is not touched — those sets belong to this phone's
 * user and sync on the next sign-in.
 */
export class SignOutUseCase {
  constructor(
    private readonly endSession: () => Promise<void>,
    private readonly leaveForSignIn: () => void,
  ) {}

  async execute(): Promise<void> {
    await this.endSession()
    this.leaveForSignIn()
  }
}
