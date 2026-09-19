import { SetMetadata } from '@nestjs/common'

export const IS_PUBLIC = 'auth:public'

/** Opts a route out of the global session guard. Used only by sign-in. */
export const Public = () => SetMetadata(IS_PUBLIC, true)
