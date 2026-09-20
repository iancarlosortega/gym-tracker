import type { EnvironmentVariables } from '@api/config/environment.schema.js'
import { Global, Injectable, Module, type OnApplicationShutdown } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

export const DATABASE = Symbol('DATABASE')
const POSTGRES_CLIENT = Symbol('POSTGRES_CLIENT')

/**
 * Closes the connection pool when the application goes down.
 *
 * Without this a short-lived process — the account seed, most obviously —
 * finishes its work and then hangs forever on an open socket, which is a
 * documented operator step that never returns.
 */
@Injectable()
class DatabaseConnection implements OnApplicationShutdown {
  constructor(private readonly client: postgres.Sql) {}

  async onApplicationShutdown(): Promise<void> {
    await this.client.end()
  }
}

@Global()
@Module({
  providers: [
    {
      provide: POSTGRES_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService<EnvironmentVariables, true>) =>
        postgres(config.get('DATABASE_URL', { infer: true })),
    },
    {
      provide: DATABASE,
      inject: [POSTGRES_CLIENT],
      useFactory: (client: postgres.Sql) => drizzle(client),
    },
    {
      provide: DatabaseConnection,
      inject: [POSTGRES_CLIENT],
      useFactory: (client: postgres.Sql) => new DatabaseConnection(client),
    },
  ],
  exports: [DATABASE],
})
export class DatabaseModule {}
