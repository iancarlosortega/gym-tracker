import { describe, expect, it } from 'vitest'
import { EmailTakenError } from './email-taken.error.ts'
import type { Credentials } from './sign-in.port.ts'
import type { SignUpPort } from './sign-up.port.ts'
import { SignUpUseCase } from './sign-up.use-case.ts'

class RecordingGateway implements SignUpPort {
  readonly received: Credentials[] = []

  async signUp(credentials: Credentials): Promise<void> {
    this.received.push(credentials)
  }
}

class TakenGateway implements SignUpPort {
  async signUp(): Promise<void> {
    throw new EmailTakenError()
  }
}

describe('SignUpUseCase', () => {
  it('trims the address a phone keyboard padded, and leaves the password alone', async () => {
    const gateway = new RecordingGateway()

    await new SignUpUseCase(gateway).execute({ email: ' new@example.com ', password: ' pa ss ' })

    expect(gateway.received).toEqual([{ email: 'new@example.com', password: ' pa ss ' }])
  })

  it('lets a refusal through unchanged', async () => {
    await expect(
      new SignUpUseCase(new TakenGateway()).execute({ email: 'a@b.c', password: 'long enough' }),
    ).rejects.toBeInstanceOf(EmailTakenError)
  })
})
