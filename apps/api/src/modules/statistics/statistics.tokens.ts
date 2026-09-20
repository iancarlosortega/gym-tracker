/**
 * Injection tokens for the statistics module.
 *
 * Ports are interfaces and vanish at runtime, so Nest needs a token to bind
 * each one to its adapter. They live here rather than in the module so the
 * use cases can name the port they want without importing the composition root.
 */
export const STATISTICS_REPOSITORY = Symbol('STATISTICS_REPOSITORY')
