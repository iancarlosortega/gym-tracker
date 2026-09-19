import 'reflect-metadata'
import { AppModule } from '@api/app.module.js'
import { NestFactory } from '@nestjs/core'

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule)
  const port = Number(process.env.PORT ?? 3001)
  await app.listen(port)
}

void bootstrap()
