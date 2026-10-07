# Delta Spec — auth

Capability: anyone can create their own account and sign straight in.

## ADDED Requirements

### Requirement: Anyone can register an account

The system SHALL let anyone without a session create an account with an email address and a password. Creating the account SHALL also sign them in.

#### Scenario: Registering signs the new user in
- **GIVEN** no account exists for `new@example.com`
- **WHEN** a visitor registers with `new@example.com` and a valid password
- **THEN** the account is created
- **AND** an authenticated session is established
- **AND** Home is shown

#### Scenario: A new account starts empty
- **GIVEN** an existing user with exercises, routines and workouts
- **WHEN** a new user registers and opens Home, the catalog and Progress
- **THEN** none of the existing user's data is shown

#### Scenario: The new account can sign in later
- **GIVEN** a user who registered and then signed out
- **WHEN** they sign in with the same email and password
- **THEN** an authenticated session is established

### Requirement: One account per email address

The system SHALL hold at most one account per email address, comparing addresses without regard to letter case or surrounding spaces.

#### Scenario: A taken email is refused with a way forward
- **GIVEN** an account exists for `ian@example.com`
- **WHEN** a visitor registers with ` Ian@Example.com `
- **THEN** no account is created
- **AND** the visitor is told an account with that email already exists
- **AND** they are offered the way to sign in

#### Scenario: An unusable email is refused
- **WHEN** a visitor registers with `not-an-email`
- **THEN** no account is created
- **AND** the visitor is told the email address is not usable

### Requirement: Passwords meet a minimum length

The system SHALL accept a password of 8 to 512 characters when registering, and SHALL NOT impose character-class composition rules.

#### Scenario: A short password is refused
- **WHEN** a visitor registers with a 7-character password
- **THEN** no account is created
- **AND** the visitor is told the password needs at least 8 characters

#### Scenario: A long passphrase without symbols is accepted
- **WHEN** a visitor registers with `correct horse battery staple`
- **THEN** the account is created

### Requirement: Public auth requests are rate limited

The system SHALL limit registration and sign-in attempts per client, and SHALL refuse attempts over the limit without creating an account or a session.

#### Scenario: Too many attempts are refused for a while
- **GIVEN** a client that made 5 registration attempts within one minute
- **WHEN** it makes a 6th attempt within that minute
- **THEN** the attempt is refused
- **AND** the visitor is told to wait and try again

#### Scenario: One client's limit does not block another
- **GIVEN** client A is over the limit
- **WHEN** client B signs in
- **THEN** client B's attempt is processed normally

## MODIFIED Requirements

### Requirement: Credential authentication

The system SHALL authenticate a user with an email address and a password, and SHALL NOT offer third-party identity providers.

(Previously: "Single-account credential authentication", which held exactly one account.)

#### Scenario: Correct credentials authenticate
- **WHEN** a user submits their registered email and correct password
- **THEN** the system establishes an authenticated session

#### Scenario: Incorrect password is refused
- **WHEN** a user submits a registered email with an incorrect password
- **THEN** the system refuses authentication
- **AND** the response does not reveal whether the email exists

### Requirement: Passwords are never recoverable

The system SHALL store passwords only as a salted one-way hash, and SHALL NOT provide a password reset flow, a password hint, or an email-change flow.

#### Scenario: No reset path is exposed
- **WHEN** the user views the sign-in or register screen
- **THEN** no password reset or account recovery option is offered

#### Scenario: Stored credentials cannot be reversed
- **WHEN** the stored credential record is inspected
- **THEN** it contains no plaintext or reversibly-encrypted password
