import { describe, expect, it } from 'vitest'
import { InvalidCredentialsError } from './invalid-credentials.error.ts'
import type { Credentials, SignInPort } from './sign-in.port.ts'
import { SignInUseCase } from './sign-in.use-case.ts'

class RecordingGateway implements SignInPort {
  readonly received: Credentials[] = []

  async signIn(credentials: Credentials): Promise<void> {
    this.received.push(credentials)
  }
}

class RefusingGateway implements SignInPort {
  async signIn(): Promise<void> {
    throw new InvalidCredentialsError()
  }
}

describe('SignInUseCase', () => {
  it('trims the address a phone keyboard padded, and leaves the password alone', async () => {
    const gateway = new RecordingGateway()

    await new SignInUseCase(gateway).execute({ email: ' ian@example.com ', password: ' pa ss ' })

    expect(gateway.received).toEqual([{ email: 'ian@example.com', password: ' pa ss ' }])
  })

  it('lets a refusal through unchanged', async () => {
    await expect(
      new SignInUseCase(new RefusingGateway()).execute({ email: 'a@b.c', password: 'x' }),
    ).rejects.toBeInstanceOf(InvalidCredentialsError)
  })
})
