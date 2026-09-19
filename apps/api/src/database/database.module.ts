import type { EnvironmentVariables } from '@api/config/environment.schema.js'
import { Global, Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

export const DATABASE = Symbol('DATABASE')

@Global()
@Module({
  providers: [
    {
      provide: DATABASE,
      inject: [ConfigService],
      useFactory: (config: ConfigService<EnvironmentVariables, true>) =>
        drizzle(postgres(config.get('DATABASE_URL', { infer: true }))),
    },
  ],
  exports: [DATABASE],
})
export class DatabaseModule {}
