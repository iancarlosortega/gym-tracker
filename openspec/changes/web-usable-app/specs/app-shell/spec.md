# Delta Spec — app-shell

Capability: getting around the app and starting a workout from anywhere.

## ADDED Requirements

### Requirement: Every main area is one tap away

The web app SHALL show a persistent tab bar on its main screens with Home, Progress, a central start action, Routines and Profile, and SHALL mark the current area.

#### Scenario: Reaching any area without typing a URL
- **GIVEN** a signed-in user on any main screen
- **WHEN** they tap a tab
- **THEN** that area opens
- **AND** its tab is marked as current

#### Scenario: The app opens on Home
- **WHEN** the user opens the installed app or the root address while signed in
- **THEN** Home is shown

### Requirement: Home suggests the next routine

Home SHALL name the suggested next routine, show which days of the current week were trained, list the active routines, and summarise the week's workouts, sets and lifts that went up.

#### Scenario: Suggested routine is named
- **GIVEN** the routines Legs (last done Monday) and Push day (last done Thursday)
- **WHEN** Home is shown on Sunday
- **THEN** the headline names Legs as up next

#### Scenario: Days trained this week
- **GIVEN** workouts started on Monday, Thursday and Friday of the current week
- **WHEN** Home is shown
- **THEN** those three days are marked as trained and today is marked as today

### Requirement: Starting a workout is always explicit

The web app SHALL NOT start a workout from tapping a routine on Home. Tapping it SHALL offer to start the routine or to see its plan.

#### Scenario: Tapping a routine on Home
- **WHEN** the user taps a routine on Home
- **THEN** a sheet offers "Start <routine>" and "See the plan"
- **AND** no workout has started

#### Scenario: Starting from the sheet
- **WHEN** the user chooses "Start <routine>" in that sheet
- **THEN** a workout following that routine starts and the workout screen opens

### Requirement: The central action starts quickly

The central start action SHALL offer: start the suggested routine immediately, pick a different routine, or start an empty workout.

#### Scenario: Quick start of the suggested routine
- **GIVEN** Legs is up next
- **WHEN** the user opens the central action and chooses "Start Legs"
- **THEN** a workout following Legs starts without further confirmation

#### Scenario: Picking a different routine
- **WHEN** the user chooses "Pick a different routine" and taps Push day
- **THEN** a workout following Push day starts

#### Scenario: Empty workout
- **WHEN** the user chooses "Empty workout"
- **THEN** a workout with no routine starts

### Requirement: An open workout stays in reach

While a workout is open and its screen is minimised, the web app SHALL show the workout's routine, elapsed time and logged set count above the tab bar, with a way back to it and a way to finish it, and the central action SHALL return to it.

#### Scenario: Minimised workout
- **GIVEN** an open workout following Push day with 14 sets logged
- **WHEN** the user minimises the workout screen
- **THEN** a bar reads Push day, its elapsed time and 14 sets
- **AND** tapping the bar or the central action reopens the workout screen

#### Scenario: Routines cannot start a second workout
- **GIVEN** an open workout
- **WHEN** Home lists routines
- **THEN** starting another routine is unavailable until the open one is finished
