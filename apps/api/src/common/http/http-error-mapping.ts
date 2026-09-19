import type { HttpException } from '@nestjs/common'

/**
 * How one feature's error codes become HTTP responses.
 *
 * Each module owns a mapping for its own codes, beside the module rather than
 * in a single table that grows with the whole system. The filter composes them,
 * so there is still exactly one place that answers "what status is this?".
 */
export type HttpErrorMapping<TCode extends string> = Record<TCode, () => HttpException>
