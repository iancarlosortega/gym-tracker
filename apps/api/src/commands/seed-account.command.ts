import 'reflect-metadata'
import { AppModule } from '@api/app.module.js'
import { SeedAccountUseCase } from '@api/modules/auth/application/use-cases/seed-account.use-case.js'
import { NestFactory } from '@nestjs/core'

/**
 * Create the single account, once, from the command line.
 *
 * Deliberately not an HTTP route: this system has one user, so registration is
 * an operator action rather than an endpoint anyone can reach.
 */
async function main(): Promise<void> {
  const [email, password] = process.argv.slice(2)

  if (email === undefined || password === undefined) {
    console.error('Usage: seed-account <email> <password>')
    process.exitCode = 1
    return
  }

  const context = await NestFactory.createApplicationContext(AppModule, { logger: false })

  try {
    await context.get(SeedAccountUseCase).execute({ email, password })
    console.log(`Account created for ${email}.`)
  } finally {
    await context.close()
  }
}

void main()
