/**
 * Injection tokens for the push module.
 *
 * Ports are interfaces and vanish at runtime, so Nest needs a token to bind
 * each one to its adapter. They live here rather than in the module so the
 * use cases can name the port they want without importing the composition root.
 */
export const PUSH_SCHEDULER = Symbol('PUSH_SCHEDULER')
export const PUSH_SENDER = Symbol('PUSH_SENDER')
export const PUSH_SUBSCRIPTION_REPOSITORY = Symbol('PUSH_SUBSCRIPTION_REPOSITORY')
export const CLOCK = Symbol('PUSH_CLOCK')
