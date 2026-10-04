import { type QueryClient, useMutation, useQueryClient } from '@tanstack/react-query'
import { statisticsKeys } from '../../statistics/presentation/queries'
import { applyRecompute, previewRecompute } from '../infrastructure/recompute.api'

/** A recompute rewrites historic loads, so every statistic read before it is now wrong. */
export const invalidateAfterRecompute = (client: QueryClient): Promise<void> =>
  client.invalidateQueries({ queryKey: statisticsKeys.all })

/** A POST because the server issues a token with it, though nothing changes yet. */
export const usePreviewRecompute = (equipmentId: string) =>
  useMutation({ mutationFn: () => previewRecompute(equipmentId) })

export const useApplyRecompute = (equipmentId: string) => {
  const client = useQueryClient()

  return useMutation({
    mutationFn: (previewToken: string) => applyRecompute(equipmentId, previewToken),
    onSuccess: () => invalidateAfterRecompute(client),
  })
}
