import type { Credentials, SignInPort } from './sign-in.port'

/**
 * Sign in with an email and password.
 *
 * The address is trimmed because a phone keyboard appends a space after an
 * autocompleted word; the password is passed on exactly as typed.
 */
export class SignInUseCase {
  constructor(private readonly gateway: SignInPort) {}

  async execute(credentials: Credentials): Promise<void> {
    await this.gateway.signIn({
      email: credentials.email.trim(),
      password: credentials.password,
    })
  }
}
