import 'reflect-metadata'
import { AppModule } from '@api/app.module.js'
import { DomainExceptionFilter } from '@api/common/filters/domain-exception.filter.js'
import type { EnvironmentVariables } from '@api/config/environment.schema.js'
import { ValidationPipe } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'
import type { NestExpressApplication } from '@nestjs/platform-express'
import cookieParser from 'cookie-parser'

async function bootstrap(): Promise<void> {
  // Environment validation runs while the application is created, so a
  // contradictory configuration — notably an origin pair that could never hold
  // a session — stops the process before it ever listens.
  const app = await NestFactory.create<NestExpressApplication>(AppModule)
  const config = app.get(ConfigService<EnvironmentVariables, true>)

  // Behind Caddy, the caller is in X-Forwarded-For. The auth rate limit keys
  // on it, so without this every request would look like the proxy.
  app.set('trust proxy', config.get('TRUST_PROXY', { infer: true }))

  app.use(cookieParser())

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      transformOptions: { enableImplicitConversion: false },
    }),
  )

  // One place translates domain failures into HTTP. Controllers state the happy
  // path and let the failure travel.
  app.useGlobalFilters(new DomainExceptionFilter())

  app.enableCors({ origin: config.get('FRONTEND_ORIGIN', { infer: true }), credentials: true })

  // So a container stop closes the database pool and the rest-alert tick
  // rather than being killed with them still open.
  app.enableShutdownHooks()

  await app.listen(config.get('PORT', { infer: true }))
}

void bootstrap()
