# Delta Spec — app-shell

Capability: Home while a workout is open.

## ADDED Requirements

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
