/**
 * Injection tokens for the routines module.
 *
 * Ports are interfaces and vanish at runtime, so Nest needs a token to bind
 * each one to its adapter. They live here rather than in the module so the
 * use cases can name the port they want without importing the composition root.
 */
export const ROUTINE_REPOSITORY = Symbol('ROUTINE_REPOSITORY')
export const EXERCISE_REPOSITORY = Symbol('ROUTINES_EXERCISE_REPOSITORY')
export const EQUIPMENT_REPOSITORY = Symbol('ROUTINES_EQUIPMENT_REPOSITORY')
export const CLOCK = Symbol('ROUTINES_CLOCK')
