import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { DisplayUnit } from '@/lib/units'
import { changeDisplayUnit, getMe } from '../infrastructure/auth.api'

export const authKeys = {
  all: ['auth'] as const,
  me: () => [...authKeys.all, 'me'] as const,
}

export const meQuery = () => queryOptions({ queryKey: authKeys.me(), queryFn: () => getMe() })

export const useMe = () => useQuery(meQuery())

/** Kilograms until the account says otherwise, so a screen never waits on it. */
export const useDisplayUnit = (): DisplayUnit => (useMe().data?.displayUnit === 'LB' ? 'LB' : 'KG')

export const useChangeDisplayUnit = () => {
  const client = useQueryClient()

  return useMutation({
    mutationFn: (unit: DisplayUnit) => changeDisplayUnit(unit),
    onSuccess: (me) => client.setQueryData(authKeys.me(), me),
  })
}
