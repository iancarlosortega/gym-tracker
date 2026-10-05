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
### Requirement: Home reads days in local time

Home's week strip and the "Last done" labels SHALL use the phone's local days.

#### Scenario: Last done this evening
- **GIVEN** a phone in America/Guayaquil and Push day last started at 20:24 local time today
- **WHEN** Home is shown at 21:37 local time
- **THEN** Push day reads "Last done today"
- **AND** today is marked as trained in the week strip
### Requirement: Home shows the open workout's progress

While a workout is open, Home's headline SHALL name its routine and how many of the routine's planned exercises are done, and SHALL lead back to the workout. A planned exercise SHALL count as done when its logged sets reach its target sets, or after one set when it has no target. Exercises added outside the plan SHALL NOT count. Sets still waiting to sync SHALL count.

#### Scenario: Three of five done
- **GIVEN** an open workout following Push day, which plans 5 exercises with 3 target sets each
- **AND** 3 sets logged on each of 3 of them
- **WHEN** Home is shown
- **THEN** the headline reads "Push day, 3 of 5 done"
- **AND** tapping it opens the workout screen

#### Scenario: Partly done exercise
- **GIVEN** an open Push day workout where Bench targets 3 sets and has 2 logged
- **WHEN** Home is shown
- **THEN** Bench is not counted as done

#### Scenario: No target counts after one set
- **GIVEN** an open workout whose plan has Plank with no target sets
- **WHEN** one set of Plank is logged
- **THEN** Plank counts as done

#### Scenario: Offline sets count
- **GIVEN** an open workout and a set logged offline that has not synced yet
- **WHEN** Home is shown
- **THEN** that set counts toward its exercise

#### Scenario: Workout without a routine
- **GIVEN** an open workout that follows no routine
- **WHEN** Home is shown
- **THEN** the headline reads "Workout in progress" and leads back to it
