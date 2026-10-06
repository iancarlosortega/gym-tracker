/**
 * The server refused the address or the password as unusable.
 *
 * The form checks both before sending, so this is rare; when it happens the
 * server's own reason is the most precise thing to show.
 */
export class SignUpRejectedError extends Error {
  constructor(reason: string) {
    super(reason)
    this.name = 'SignUpRejectedError'
  }
}
