# Delta Spec — app-shell

Capability: starting a workout from the central action.

## MODIFIED Requirements

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
