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

The central start action SHALL offer: start the suggested routine immediately, pick a different routine, or start an empty workout. The choices SHALL appear in a popover anchored above the central action and pointing at it. Picking a different routine SHALL happen inside the same popover. With many routines, the picker SHALL stay within a bounded height, scroll on its own, and offer a search.

#### Scenario: Quick start of the suggested routine
- **GIVEN** Legs is up next
- **WHEN** the user opens the central action and chooses "Start Legs"
- **THEN** a workout following Legs starts without further confirmation

#### Scenario: Picking a different routine
- **WHEN** the user chooses "Pick another routine" and taps Push day
- **THEN** a workout following Push day starts

#### Scenario: Empty workout
- **WHEN** the user chooses "Empty workout"
- **THEN** a workout with no routine starts

#### Scenario: The menu comes out of the central action
- **WHEN** the user taps the central action
- **THEN** the choices appear above it, pointing at it
- **AND** the central action shows that it now closes the menu

#### Scenario: The picker opens in place
- **GIVEN** the menu is open
- **WHEN** the user chooses "Pick another routine"
- **THEN** the same popover shows the routines, with up next first and marked
- **AND** each routine shows its exercise count and when it was last done
- **AND** a back control returns to the menu

#### Scenario: A long list scrolls inside the popover
- **GIVEN** the user has 20 routines
- **WHEN** the picker is shown
- **THEN** the popover keeps a bounded height and the list scrolls within it

#### Scenario: Search appears for many routines
- **GIVEN** the user has 8 or more routines
- **WHEN** the picker is shown
- **THEN** a search box filters the routines by name, ignoring case

#### Scenario: No search for a short list
- **GIVEN** the user has 7 routines
- **WHEN** the picker is shown
- **THEN** no search box is shown

#### Scenario: Nothing matches
- **WHEN** the search matches no routine
- **THEN** the picker says no routine matches

#### Scenario: Managing routines from the picker
- **WHEN** the user chooses "Manage routines" in the picker
- **THEN** the Routines screen is shown

#### Scenario: Closing the menu
- **GIVEN** the menu is open
- **WHEN** the user presses Escape, taps outside it, or taps the central action again
- **THEN** the menu closes and no workout starts

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

### Requirement: History is reachable from Progress, Home and Profile

History SHALL be a view inside Progress, and Home and Profile SHALL each link to it. While History or a workout from it is open, the Progress tab SHALL be marked as current.

#### Scenario: From Progress
- **WHEN** the user opens Progress
- **THEN** they can switch to History in one tap

#### Scenario: From Home
- **WHEN** the user taps the History link on Home
- **THEN** History opens
- **AND** the Progress tab is marked as current

#### Scenario: From Profile
- **WHEN** the user taps History on Profile
- **THEN** History opens

### Requirement: Sign-in and register link to each other

The sign-in screen SHALL offer a way to the register screen, and the register screen SHALL offer a way back to sign-in. Both SHALL be reachable without a session.

#### Scenario: From sign-in to register
- **GIVEN** a visitor without a session on the sign-in screen
- **WHEN** they choose to create an account
- **THEN** the register screen is shown

#### Scenario: From register back to sign-in
- **GIVEN** a visitor on the register screen
- **WHEN** they choose to sign in instead
- **THEN** the sign-in screen is shown

#### Scenario: Where the visitor was going is kept
- **GIVEN** a visitor sent to sign-in from `/routines`
- **WHEN** they go to register and create an account
- **THEN** `/routines` is shown

#### Scenario: Register is never a destination after signing in
- **GIVEN** a register link whose `next` points at the register or sign-in screen
- **WHEN** the visitor creates an account
- **THEN** Home is shown

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
