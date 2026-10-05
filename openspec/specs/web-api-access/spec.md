# Delta Spec — web-api-access

Capability: how the web app reaches the API. This covers where the API lives, how the session travels with each request, what happens when the session lapses, and how reads are reused.

## ADDED Requirements

### Requirement: The API location is fixed when the web app is built

The web app SHALL take the API's address from build configuration, and SHALL refuse to run without it rather than send requests to an unintended address.

#### Scenario: Configured address is used
- **GIVEN** the web app was built with an API address
- **WHEN** any screen requests data
- **THEN** the request goes to that address

#### Scenario: Missing address fails loudly
- **GIVEN** the web app was built without an API address
- **WHEN** the API client is first loaded
- **THEN** it fails with an error naming the missing setting
- **AND** no request is sent to the web app's own origin

### Requirement: Every API request carries the session

The web app SHALL send the session cookie with every API request, including requests to the API's separate subdomain.

#### Scenario: Authenticated read succeeds cross-origin
- **GIVEN** a signed-in user
- **WHEN** a screen reads data from the API
- **THEN** the request includes the session cookie

### Requirement: A lapsed session returns the user to sign-in

The web app SHALL send the user to the sign-in screen whenever the API reports the session as unauthenticated, and SHALL bring them back to where they were after signing in.

#### Scenario: Lapsed session redirects with a return path
- **GIVEN** the user is on `/statistics?week=2`
- **WHEN** an API request is answered as unauthenticated
- **THEN** the browser performs a full navigation to `/sign-in?next=%2Fstatistics%3Fweek%3D2`

#### Scenario: No redirect loop on the sign-in screen
- **GIVEN** the user is already on `/sign-in`
- **WHEN** an API request is answered as unauthenticated
- **THEN** no navigation happens

#### Scenario: Wrong credentials are not a lapsed session
- **WHEN** a sign-in attempt is refused for wrong credentials
- **THEN** the user stays on the sign-in screen
- **AND** sees that the credentials were invalid
- **AND** no redirect happens

### Requirement: Distinct failures keep their meaning

The web app SHALL keep failures that have their own answer distinct from generic failures.

#### Scenario: Stale recompute preview
- **GIVEN** a recompute preview whose history has since changed
- **WHEN** the user confirms that preview
- **THEN** the user is told the history changed and is asked to look again
- **AND** is not shown a generic error

#### Scenario: Unreachable server
- **WHEN** a read fails because the server cannot be reached or answers with an error
- **THEN** the screen shows its existing unreachable message rather than crashing

### Requirement: Reads are reused and refreshed

The web app SHALL reuse recent reads across screens and SHALL refresh them when the user returns to the app.

#### Scenario: Returning to a screen reuses its data
- **GIVEN** the user viewed the week statistics less than 30 seconds ago
- **WHEN** they navigate away and back
- **THEN** the statistics render immediately, without a loading state

#### Scenario: Coming back to the app refreshes data
- **GIVEN** the app was in the background
- **WHEN** the user brings it back to the foreground
- **THEN** stale reads on the visible screen are refreshed

#### Scenario: Two parts of a screen needing the same data ask once
- **WHEN** two components on one screen need the exercise list at the same time
- **THEN** a single request is made

### Requirement: Offline logging is unaffected

The web app SHALL keep logging sets offline exactly as before this change.

#### Scenario: Logging without connectivity still queues sets
- **GIVEN** the device has no connectivity
- **WHEN** the user logs a set
- **THEN** the set is queued locally and syncs once the API is reachable
