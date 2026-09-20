/**
 * Injection tokens for the routines module.
 *
 * Ports are interfaces and vanish at runtime, so Nest needs a token to bind
 * each one to its adapter. They live here rather than in the module so the
 * use cases can name the port they want without importing the composition root.
 *
 * The exercise and equipment repositories are not here: they belong to the
 * catalog, and routines imports that module rather than binding a second
 * instance of each.
 */
export const ROUTINE_REPOSITORY = Symbol('ROUTINE_REPOSITORY')
export const CLOCK = Symbol('ROUTINES_CLOCK')
