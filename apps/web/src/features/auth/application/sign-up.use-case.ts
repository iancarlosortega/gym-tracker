import type { Credentials } from './sign-in.port'
import type { SignUpPort } from './sign-up.port'

/**
 * Create an account with an email and password, and sign it in.
 *
 * The address is trimmed for the same reason as on sign-in; the password is
 * passed on exactly as typed.
 */
export class SignUpUseCase {
  constructor(private readonly gateway: SignUpPort) {}

  async execute(credentials: Credentials): Promise<void> {
    await this.gateway.signUp({
      email: credentials.email.trim(),
      password: credentials.password,
    })
  }
}
