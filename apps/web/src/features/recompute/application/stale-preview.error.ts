/**
 * Thrown when the server refuses a preview token whose history has since moved.
 *
 * A distinct error rather than a generic failure because it has its own
 * answer — look again — and "something went wrong" would hide the one fact
 * that explains it.
 */
export class StalePreviewError extends Error {
  constructor() {
    super('This history has changed since that preview.')
    this.name = 'StalePreviewError'
  }
}
