import { queryOptions, useMutation, useQuery } from '@tanstack/react-query'
import { optimisticMutation, patch } from '@/lib/optimistic'
import type { DisplayUnit } from '@/lib/units'
import { changeDisplayUnit, getMe, type MeResponse } from '../infrastructure/auth.api'

export const authKeys = {
  all: ['auth'] as const,
  me: () => [...authKeys.all, 'me'] as const,
}

export const meQuery = () => queryOptions({ queryKey: authKeys.me(), queryFn: () => getMe() })

export const useMe = () => useQuery(meQuery())

/** Kilograms until the account says otherwise, so a screen never waits on it. */
export const useDisplayUnit = (): DisplayUnit => (useMe().data?.displayUnit === 'LB' ? 'LB' : 'KG')

/**
 * The unit flips the moment it is tapped, everywhere it is read.
 *
 * Taps reach the server one at a time and in order, so switching to lb and
 * straight back to kg ends on kg there too.
 */
export const useChangeDisplayUnit = () =>
  useMutation(
    optimisticMutation<DisplayUnit, MeResponse>({
      mutationKey: [...authKeys.me(), 'display-unit'],
      scope: 'display-unit',
      mutationFn: (unit) => changeDisplayUnit(unit),
      patches: (displayUnit) => [
        patch<MeResponse>(authKeys.me(), (me) => ({ ...me, displayUnit })),
      ],
      invalidates: [authKeys.me()],
    }),
  )
