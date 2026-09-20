import type { AuthenticatedCaller } from '@api/modules/auth/application/use-cases/validate-session.use-case.js'
import { createParamDecorator, type ExecutionContext } from '@nestjs/common'

/**
 * The request once the session guard has resolved it.
 *
 * Declared here rather than in the auth module so any module can read the
 * caller without importing another feature's presentation layer.
 */
export interface RequestWithCaller {
  caller?: AuthenticatedCaller
  cookies?: Record<string, string>
}

/**
 * Extractors live beside their decorators and are exported so they can be
 * tested directly: a `createParamDecorator` result is awkward to exercise
 * without standing up a Nest context, and the logic inside it is the part
 * worth testing.
 */
export function readUserId(request: RequestWithCaller): string {
  const id = request.caller?.user.id.value

  if (id === undefined) {
    // Unreachable through the guard, which refuses anything without a caller.
    // Throwing beats returning an empty string that would quietly scope a
    // query to nobody and return an empty list as though that were the truth.
    throw new Error('No caller on the request; the session guard should have refused it.')
  }
  return id
}

export function readSessionId(request: RequestWithCaller): string | undefined {
  return request.caller?.session.id.value
}

function requestOf(context: ExecutionContext): RequestWithCaller {
  return context.switchToHttp().getRequest<RequestWithCaller>()
}

/** The signed-in user's id. */
export const GetUserId = createParamDecorator((_data: unknown, context: ExecutionContext) =>
  readUserId(requestOf(context)),
)

/** The id of the session this request arrived on. */
export const GetSessionId = createParamDecorator((_data: unknown, context: ExecutionContext) =>
  readSessionId(requestOf(context)),
)

/** The full caller, for the rare endpoint that needs more than an id. */
export const GetCaller = createParamDecorator(
  (_data: unknown, context: ExecutionContext) => requestOf(context).caller,
)
