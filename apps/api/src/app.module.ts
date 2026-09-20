import { environmentSchema } from '@api/config/environment.schema.js'
import { DatabaseModule } from '@api/database/database.module.js'
import { AuthModule } from '@api/modules/auth/auth.module.js'
import { CatalogModule } from '@api/modules/catalog/catalog.module.js'
import { MeasurementModule } from '@api/modules/measurement/measurement.module.js'
import { PushModule } from '@api/modules/push/push.module.js'
import { RecomputeModule } from '@api/modules/recompute/recompute.module.js'
import { RoutinesModule } from '@api/modules/routines/routines.module.js'
import { StatisticsModule } from '@api/modules/statistics/statistics.module.js'
import { WorkoutsModule } from '@api/modules/workouts/workouts.module.js'
import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, cache: true, validationSchema: environmentSchema }),
    DatabaseModule,
    AuthModule,
    CatalogModule,
    RoutinesModule,
    WorkoutsModule,
    MeasurementModule,
    PushModule,
    StatisticsModule,
    RecomputeModule,
  ],
})
export class AppModule {}
