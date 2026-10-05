# Delta Spec — auth

Capability: leaving the account on this phone.

## ADDED Requirements

### Requirement: The user can sign out

The web app SHALL let the signed-in user sign out from their profile, which ends the session on the server and returns them to the sign-in screen.

#### Scenario: Signing out
- **GIVEN** a signed-in user on Profile
- **WHEN** they choose Sign out
- **THEN** the session ends
- **AND** the sign-in screen is shown
- **AND** returning to a previous screen requires signing in again

#### Scenario: Profile shows who is signed in
- **WHEN** the user opens Profile
- **THEN** it shows the signed-in email
- **AND** it shows how many sets on this phone are still waiting to sync
### Requirement: Single-account credential authentication

The system SHALL authenticate the user with an email address and a password, and SHALL NOT offer third-party identity providers.

#### Scenario: Correct credentials authenticate
- **WHEN** the user submits the registered email and correct password
- **THEN** the system establishes an authenticated session

#### Scenario: Incorrect password is refused
- **WHEN** the user submits the registered email with an incorrect password
- **THEN** the system refuses authentication
- **AND** the response does not reveal whether the email exists

### Requirement: Passwords are never recoverable

The system SHALL store passwords only as a salted one-way hash, and SHALL NOT provide a password reset flow, a password hint, or an email-change flow.

#### Scenario: No reset path is exposed
- **WHEN** the user views the sign-in screen
- **THEN** no password reset or account recovery option is offered

#### Scenario: Stored credentials cannot be reversed
- **WHEN** the stored credential record is inspected
- **THEN** it contains no plaintext or reversibly-encrypted password

### Requirement: Sessions are held in a server-set HttpOnly cookie

The system SHALL maintain authentication state in a server-issued session cookie marked HttpOnly and Secure, and SHALL NOT place session credentials in storage writable by page scripts.

#### Scenario: Session cookie is not script-readable
- **GIVEN** an authenticated session
- **WHEN** page scripts enumerate readable cookies and web storage
- **THEN** the session credential is not present among them

#### Scenario: Session survives prolonged inactivity within its lifetime
- **GIVEN** an authenticated session with a 90-day lifetime
- **WHEN** the user returns after 14 days without opening the application
- **THEN** the user is still authenticated and is not asked to sign in again

#### Scenario: Expired session requires re-authentication
- **GIVEN** a session whose expiry has passed
- **WHEN** the user makes an authenticated request
- **THEN** the request is refused and the user is directed to sign in

### Requirement: Frontend and API share one registrable domain

The system SHALL serve the frontend and the API under the same registrable domain so that the session cookie is treated as same-site.

#### Scenario: Cross-site deployment is rejected at configuration time
- **WHEN** the application starts with a frontend origin and an API origin that do not share a registrable domain
- **THEN** startup fails with an explicit configuration error

### Requirement: All workout data requires authentication

The system SHALL refuse any read or write of exercises, equipment, routines, sessions, sets, or statistics without a valid session.

#### Scenario: Unauthenticated data access is refused
- **WHEN** a request for workout data arrives without a valid session
- **THEN** the system refuses it and returns no data
