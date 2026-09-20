/**
 * Injection tokens for the auth module.
 *
 * Ports are interfaces and vanish at runtime, so Nest needs a token to bind
 * each one to its adapter. They live here rather than in the module so the
 * use cases can name the port they want without importing the composition root.
 */
export const USER_REPOSITORY = Symbol('USER_REPOSITORY')
export const SESSION_REPOSITORY = Symbol('SESSION_REPOSITORY')
export const PASSWORD_HASHER = Symbol('PASSWORD_HASHER')
export const CLOCK = Symbol('CLOCK')

/** Session lifetime, read from configuration rather than hardcoded in a use case. */
export const SESSION_POLICY = Symbol('SESSION_POLICY')
