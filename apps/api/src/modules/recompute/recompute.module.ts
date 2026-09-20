import { CatalogModule } from '@api/modules/catalog/catalog.module.js'
import { ApplyRecomputeUseCase } from '@api/modules/recompute/application/use-cases/apply-recompute.use-case.js'
import { PreviewRecomputeUseCase } from '@api/modules/recompute/application/use-cases/preview-recompute.use-case.js'
import { DrizzleRecomputeAudit } from '@api/modules/recompute/infrastructure/persistence/recompute-audit.repository.js'
import { ApplyRecomputeController } from '@api/modules/recompute/presentation/apply-recompute/apply-recompute.controller.js'
import { PreviewRecomputeController } from '@api/modules/recompute/presentation/preview-recompute/preview-recompute.controller.js'
import { RECOMPUTE_AUDIT } from '@api/modules/recompute/recompute.tokens.js'
import { StatisticsModule } from '@api/modules/statistics/statistics.module.js'
import { Module } from '@nestjs/common'

/**
 * Composition root for history correction.
 *
 * It borrows the equipment being corrected from the catalog and the sets to
 * correct from statistics, because both already own those reads. A third
 * copy of either would be a third chance for them to disagree.
 */
@Module({
  imports: [CatalogModule, StatisticsModule],
  controllers: [PreviewRecomputeController, ApplyRecomputeController],
  providers: [
    { provide: RECOMPUTE_AUDIT, useClass: DrizzleRecomputeAudit },
    PreviewRecomputeUseCase,
    ApplyRecomputeUseCase,
  ],
})
export class RecomputeModule {}
