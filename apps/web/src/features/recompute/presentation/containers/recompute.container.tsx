'use client'

import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { StalePreviewError } from '../../application/stale-preview.error'
import type { RecomputePreviewResponse } from '../../infrastructure/recompute.api'
import { RecomputeConsequences, SetChangeList } from '../components/recompute-consequences'
import { StalePreviewNotice } from '../components/stale-preview-notice'
import { useApplyRecompute, usePreviewRecompute } from '../queries'

export interface RecomputeContainerProps {
  readonly equipmentId: string
  readonly equipmentName: string
  readonly exerciseNames: ReadonlyMap<string, string>
  readonly onDone: () => void
}

type Outcome = 'reviewing' | 'stale' | 'applied' | 'unreachable'

/**
 * Preview, confirm, apply — and never the middle one on its own.
 *
 * The confirm button is held behind an explicit acknowledgement because this
 * is the only action in the application that rewrites something the user
 * already did. Everything else can be undone by logging another set.
 */
export const RecomputeContainer = ({
  equipmentId,
  equipmentName,
  exerciseNames,
  onDone,
}: RecomputeContainerProps) => {
  const { mutateAsync: requestPreview } = usePreviewRecompute(equipmentId)
  const { mutateAsync: applyPreview, isPending: busy } = useApplyRecompute(equipmentId)
  const [preview, setPreview] = useState<RecomputePreviewResponse | null>(null)
  const [outcome, setOutcome] = useState<Outcome>('reviewing')
  const [acknowledged, setAcknowledged] = useState(false)
  const [showLedger, setShowLedger] = useState(false)

  const refresh = useCallback(async () => {
    setAcknowledged(false)

    try {
      setPreview(await requestPreview())
      setOutcome('reviewing')
    } catch {
      setOutcome('unreachable')
    }
  }, [requestPreview])

  useEffect(() => {
    void refresh()
  }, [refresh])

  if (outcome === 'unreachable') {
    return <p role="alert">Could not reach the server, so nothing was changed.</p>
  }

  if (outcome === 'applied') {
    return (
      <div className="grid gap-4">
        <p role="status">
          Done. {preview?.affectedSets ?? 0} sets now read against the corrected {equipmentName}.
        </p>
        <Button className="justify-self-start" onClick={onDone}>
          Back
        </Button>
      </div>
    )
  }

  if (preview === null) {
    return <p>Working out what would change…</p>
  }

  if (preview.affectedSets === 0) {
    return (
      <div className="grid gap-4">
        <p>Nothing to correct: every set already reads against this {equipmentName}.</p>
        <Button className="justify-self-start" onClick={onDone}>
          Back
        </Button>
      </div>
    )
  }

  const apply = async () => {
    try {
      await applyPreview(preview.previewToken)
      setOutcome('applied')
    } catch (failure) {
      setOutcome(failure instanceof StalePreviewError ? 'stale' : 'unreachable')
    }
  }

  return (
    <div className="grid gap-5">
      {outcome === 'stale' ? (
        <StalePreviewNotice onRefresh={() => void refresh()} />
      ) : (
        <RecomputeConsequences exerciseNames={exerciseNames} preview={preview} />
      )}

      <div className={outcome === 'stale' ? 'pointer-events-none opacity-40' : undefined}>
        <Button onClick={() => setShowLedger((shown) => !shown)} variant="ghost">
          {showLedger ? 'Hide the sets' : `See all ${preview.affectedSets} sets`}
        </Button>
        {showLedger && <SetChangeList changes={preview.changes} exerciseNames={exerciseNames} />}
      </div>

      {outcome !== 'stale' && (
        <label className="flex items-start gap-3 rounded-md border border-border px-4 py-3 text-sm">
          <input
            checked={acknowledged}
            className="size-5 shrink-0"
            onChange={(event) => setAcknowledged(event.target.checked)}
            type="checkbox"
          />
          <span>
            I understand this rewrites {preview.affectedSets} logged sets and cannot be undone.
          </span>
        </label>
      )}

      <div className="grid gap-3">
        {outcome !== 'stale' && (
          <Button
            className="min-h-touch text-lg"
            disabled={!acknowledged || busy}
            onClick={() => void apply()}
          >
            Apply the correction
          </Button>
        )}
        <Button className="min-h-touch" onClick={onDone} variant="outline">
          Keep history as it is
        </Button>
      </div>
    </div>
  )
}
