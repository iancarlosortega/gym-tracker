import 'reflect-metadata'
import { AppModule } from '@api/app.module.js'
import { RegisterAccountUseCase } from '@api/modules/auth/application/use-cases/register-account.use-case.js'
import { NestFactory } from '@nestjs/core'

/**
 * Create an account from the command line.
 *
 * An operator shortcut for the same registration the register page performs,
 * so the password policy and the one-account-per-email rule apply here too.
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
    await context.get(RegisterAccountUseCase).execute({ email, password })
    console.log(`Account created for ${email}.`)
  } finally {
    await context.close()
  }
}

void main()
