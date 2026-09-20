import { PreviewRecomputeUseCase } from '@api/modules/recompute/application/use-cases/preview-recompute.use-case.js'
import type { RecomputeAudit } from '@api/modules/recompute/infrastructure/persistence/recompute-audit.repository.js'
import { RECOMPUTE_AUDIT } from '@api/modules/recompute/recompute.tokens.js'
import { StaleRecomputePreviewError } from '@gym/domain/recompute/errors'
import type { RecomputeDiff } from '@gym/domain/recompute/value-objects/recompute-diff.vo'
import { Inject, Injectable } from '@nestjs/common'

export interface ApplyRecomputeInput {
  readonly userId: string
  readonly equipmentId: string
  /** The token from the preview the user actually looked at. */
  readonly previewToken: string
}

/**
 * Apply a correction the user has seen and agreed to.
 *
 * The diff is derived again rather than trusted from the request. What the
 * client sends back is only a fingerprint of what it was shown; if anything
 * has moved since — a set logged, another correction applied — the
 * fingerprints differ and this refuses rather than applying a change nobody
 * reviewed.
 *
 * Nothing is written when the diff is empty, so confirming a preview that
 * found nothing leaves no audit row claiming otherwise.
 */
@Injectable()
export class ApplyRecomputeUseCase {
  constructor(
    private readonly preview: PreviewRecomputeUseCase,
    @Inject(RECOMPUTE_AUDIT) private readonly audit: RecomputeAudit,
  ) {}

  async execute(input: ApplyRecomputeInput): Promise<RecomputeDiff> {
    const diff = await this.preview.execute({
      userId: input.userId,
      equipmentId: input.equipmentId,
    })

    if (diff.token !== input.previewToken) {
      throw new StaleRecomputePreviewError(
        'This history has changed since that preview. Review it again before applying.',
      )
    }

    if (diff.changes.length > 0) {
      await this.audit.apply(input.userId, diff)
    }

    return diff
  }
}
