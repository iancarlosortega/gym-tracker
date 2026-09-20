import type { RequestWithCaller } from '@api/modules/auth/presentation/session.guard.js'

/** The signed-in user's id. The guard has already refused anything without one. */
export function callerId(request: RequestWithCaller): string {
  return request.caller?.user.id.value ?? ''
}
