import { queryOptions, useQuery } from '@tanstack/react-query'
import { getMe } from '../infrastructure/auth.api'

export const authKeys = {
  all: ['auth'] as const,
  me: () => [...authKeys.all, 'me'] as const,
}

export const meQuery = () => queryOptions({ queryKey: authKeys.me(), queryFn: () => getMe() })

export const useMe = () => useQuery(meQuery())
