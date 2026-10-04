/**
 * Injection tokens for the catalog module.
 *
 * Ports are interfaces and vanish at runtime, so Nest needs a token to bind
 * each one to its adapter. They live here rather than in the module so the
 * use cases can name the port they want without importing the composition root.
 */
export const EXERCISE_REPOSITORY = Symbol('EXERCISE_REPOSITORY')
export const EQUIPMENT_REPOSITORY = Symbol('EQUIPMENT_REPOSITORY')
export const CLOCK = Symbol('CATALOG_CLOCK')
export const EQUIPMENT_USAGE_REPOSITORY = Symbol('EQUIPMENT_USAGE_REPOSITORY')
