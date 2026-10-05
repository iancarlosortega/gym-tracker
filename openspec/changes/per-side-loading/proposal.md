# Proposal: Per-side loading follows the equipment

## Intent
Dumbbells and the hack squat cannot be logged per side, and the Smith bar is forced into every total. What a per-side load adds belongs to the **equipment**. Logging is also kg-only, but the owner uses lb.

## Scope
### In Scope
- Plate-loaded equipment (shown as "Plate-loaded", code kind `BARBELL`) with an **optional base weight**. Empty means not counted; mass = 2·side + (base ?? 0).
- Free weights support per side as **per hand**: mass = 2·hand.
- Base weight can be set, changed or **cleared**, and recompute covers all three.
- Migration `0001` relaxes `equipment_barbell_has_bar` and `logged_set_per_side_has_bar`. Past rows are untouched.
- `LogSetsUseCase` builds per-side entries for any equipment that supports the mode, and refuses cleanly otherwise.
- The user's display unit (lb/kg) drives logging: keypad entry, tiles, last time, done sets, and the equipment base weight. A Profile toggle uses a new `PATCH /auth/me`.
- Labels follow the equipment: "per side" or "per hand".

### Out of Scope
- Progress charts and recompute screens in lb (follow-up).
- A new equipment kind.
- Changing the sync contract: the server still reads the base weight at sync time.

## Capabilities
### New Capabilities
- `display-unit`: the user chooses lb or kg, and logging reads and writes in it.
### Modified Capabilities
- `catalog`: equipment carries an optional base weight; free weights can be loaded per hand.
- `workout-logging`: per-side sets resolve against the equipment's base weight, or none; values are shown in the user's unit.

## Approach
Exploration Approach 1, in three steps: the domain first (equipment spec, optional base, recompute), then the migration and API, then the web (units converted at the edge).

## Affected Areas
| Area | Impact | Description |
|------|--------|-------------|
| `packages/domain/src/{catalog,measurement,recompute}` | Modified | optional base, per hand, recompute clear |
| `apps/api/drizzle/0001_*.sql`, schema | New/Modified | relax two checks |
| `apps/api/src/modules/{catalog,measurement,auth}` | Modified | DTOs, log-sets, `PATCH /auth/me` |
| `apps/web/src/features/{catalog,measurement,auth}` | Modified | form, labels, unit, toggle |

## Risks
| Risk | Likelihood | Mitigation |
|------|------------|------------|
| A migration rewrites history | Low | only `DROP`/`ADD CONSTRAINT`; table tests on real SQL |
| lb rounding (integer grams) | Med | display rounds to 0.1; round-trip tests |
| Recompute with a cleared base | Med | domain tests for set, change and clear |

## Rollback Plan
Revert the slice commits. The migration's down step re-adds both checks. It is safe only if no null-base per-side rows exist, so check that before reverting.

## Success Criteria
- [ ] Smith 20/side logs 40 kg, Olympic bar 20/side logs 60 kg, hack squat 20/side logs 40 kg.
- [ ] Dumbbells 60 lb per hand log 120 lb and show "60 lb/hand" next time.
- [ ] Clearing a base weight previews and recomputes past sets.
- [ ] With lb selected, the keypad, tiles and labels read lb; existing kg history displays converted.
