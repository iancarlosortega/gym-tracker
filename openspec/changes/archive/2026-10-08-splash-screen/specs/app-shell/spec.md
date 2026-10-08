# Delta Spec — app-shell

Capability: opening the installed app.

## ADDED Requirements

### Requirement: The installed app opens with a branded launch

When the app is opened from the home screen, it SHALL show a launch screen in the icon's amber with its dumbbell. The launch SHALL animate the icon's week bars rising and one rep of the dumbbell, then SHALL shrink into the icon tile and dock into the central tab-bar action, revealing the app. The launch SHALL NOT delay or block the app loading underneath, SHALL appear at most once per cold start, and SHALL NOT appear in a regular browser tab.

#### Scenario: Native launch hands off seamlessly
- **GIVEN** the app is installed on an iPhone
- **WHEN** the user opens it from the home screen
- **THEN** the system launch screen shows the amber screen with the dumbbell
- **AND** the in-app launch starts on the same frame, without a visible cut

#### Scenario: Launch docks into the central action
- **GIVEN** the installed app opens on a screen with the tab bar
- **WHEN** the launch animation finishes rising
- **THEN** the amber screen shrinks into the icon tile
- **AND** the tile moves into the central action and becomes it
- **AND** the app is usable once the launch ends, about two seconds after opening

#### Scenario: No tab bar to dock into
- **GIVEN** the installed app opens on sign-in or on the workout screen
- **WHEN** the launch animation finishes rising
- **THEN** the tile fades out in place and the screen is shown

#### Scenario: Reduced motion
- **GIVEN** the device asks for reduced motion
- **WHEN** the installed app opens
- **THEN** the amber launch fades out without rising, rep or docking

#### Scenario: Navigating does not replay it
- **GIVEN** the launch has played
- **WHEN** the user moves between screens
- **THEN** no launch is shown again until the app is next cold started

#### Scenario: Browser tab has no launch
- **WHEN** the app is opened in a regular browser tab
- **THEN** no launch screen is shown

#### Scenario: The launch never traps the app
- **GIVEN** the app's scripts fail or load slowly
- **WHEN** three seconds have passed since opening
- **THEN** the launch screen is gone and the page underneath is visible
