/**
 * Injection tokens for the workouts module.
 *
 * Ports are interfaces and vanish at runtime, so Nest needs a token to bind
 * each one to its adapter. They live here rather than in the module so the
 * use cases can name the port they want without importing the composition root.
 *
 * The routine repository is not here: it belongs to the routines module,
 * which exports its own token.
 */
export const WORKOUT_SESSION_REPOSITORY = Symbol('WORKOUT_SESSION_REPOSITORY')
export const CLOCK = Symbol('WORKOUTS_CLOCK')
