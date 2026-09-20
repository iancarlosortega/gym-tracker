/**
 * Injection tokens for the measurement module.
 *
 * Ports are interfaces and vanish at runtime, so Nest needs a token to bind
 * each one to its adapter. They live here rather than in the module so the
 * use cases can name the port they want without importing the composition root.
 *
 * The session, exercise, equipment and user repositories are not here: they
 * belong to the modules that own them, and each exports its own token.
 */
export const SET_REPOSITORY = Symbol('SET_REPOSITORY')
