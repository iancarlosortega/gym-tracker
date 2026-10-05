## Exploration: per-side loading follows the equipment

### Current State
- `Equipment.supports` (D/catalog/entities/equipment.entity.ts:142): BARBELL → PER_SIDE|TOTAL, STACK → STACK_POSITION, FREE_WEIGHT → TOTAL. A BARBELL **requires** a positive bar weight (`specFrom` :77, DB check `equipment_barbell_has_bar`).
- Per side always adds a bar. Three layers enforce it:
  - `LoadEntry.perSide(perSide, bar)` takes a required bar, and `from()` throws `MissingBarWeightError`.
  - `LoggedSet.assertSnapshotMatchesEntry` throws for PER_SIDE with a null snapshot bar.
  - The DB check `logged_set_per_side_has_bar`.
- Mass is resolved as `2·side + bar`.
- `LogSetsUseCase` (A/.../log-sets.use-case.ts:189) builds the per-side entry from `equipment.barGrams ?? grams(NaN)`, so a non-barbell crashes with a NaN error instead of a clean refusal.
- Recompute (D/recompute/services/recompute.service.ts:34-56) is a no-op when the bar is null and only rewrites `resolved_grams`.
- Units: `DisplayUnit` KG/LB, `fromPounds`/`toPounds` exist in the domain; the user's `display_unit` is stored and exposed by `/auth/me`, but **no endpoint changes it**. Every API view returns kilograms, and the web hardcodes kg in about ten places (workout tile, last-time and done labels, equipment form and views, recompute UI, progression chart).
- The web duplicates `supports` in `workout-plan.ts` (`compatibleEquipment`, `kindsFor`).

### Affected Areas
- `packages/domain/src/catalog/entities/equipment.entity.ts` (+ test): spec, `supports`, base weight optional, `withBarWeight` able to clear.
- `packages/domain/src/measurement/value-objects/load-entry.vo.ts`, `entities/logged-set.entity.ts` (+ tests): an optional base weight for PER_SIDE.
- `packages/domain/src/recompute/services/recompute.service.ts` (+ test): base weight added, changed or cleared.
- `apps/api/drizzle/0001_*.sql` + schema: relax `equipment_barbell_has_bar` and `logged_set_per_side_has_bar`.
- `apps/api/src/modules/measurement/.../log-sets.use-case.ts`, catalog create and correct-bar DTOs/use cases, `add-routine-exercise` (follows `supports`).
- Web: `workout-plan.ts`, `new-equipment-form.tsx`, `equipment-views.tsx`, `workout-screen.container.tsx`, last-time and done labels, `set-keypad` spoken unit, recompute copy.
- Units (if in scope): `/auth/me` consumer, a `PATCH /auth/me` display-unit endpoint, every kg label above.

### Approaches
1. **Base weight is an optional property of plate-loaded equipment; dumbbells gain per hand.**
   - BARBELL is renamed in the UI to "Plate-loaded" (bar, Smith, hack squat, plate leg press), with an optional base weight: null means not counted.
   - FREE_WEIGHT supports PER_SIDE as per hand, with no base.
   - There is no new kind, so the migration only relaxes two checks.
   - Pros: smallest model change; one rule for the owner's cases. Cons: the code name BARBELL now also covers machines. Effort: Medium.
2. **A new PLATE_LOADED kind next to BARBELL**, with a sled weight; BARBELL keeps a required bar.
   - Pros: explicit kinds. Cons: the Smith still needs "bar not counted", so an optional base is needed anyway; more enum plumbing in the domain, DB, API and web. Effort: Medium-High.
3. **Encode "not counted" as base 0** with no null semantics.
   - Pros: no domain null rewrite. Cons: a bar of 0 kg and "not counted" are indistinguishable, and the DB still needs the PER_SIDE rule relaxed for free weights. Effort: Low-Medium.

### Recommendation
Approach 1, with null meaning "not counted" (mass = 2·side + (base ?? 0)). Existing sets keep their non-null snapshots, so history is untouched. Recompute gains "base cleared" (old base → 0).

Units: wire the user's display unit into the **logging flow** (keypad entry, tiles, last time, done sets, the equipment base weight), with a Profile toggle (`PATCH /auth/me`). Statistics and recompute views keep kilograms for now (follow-up).

### Risks
- History immutability: the migration must not rewrite past rows. Only checks are relaxed.
- Recompute drift: `resolved_grams` versus the snapshot bar already diverge after a correction (pre-existing).
- Sync uses live equipment at sync time, not the log-time snapshot (pre-existing; more visible once the base is editable).
- `fromPounds` rounds to integer grams: display must round (60 lb → 27 216 g → 60.0 lb).
- drizzle-kit may not diff check constraints, so the SQL is hand-written.

### Ready for Proposal
Yes, once the owner confirms two decisions: the model (Approach 1) and the units scope (logging flow plus a Profile toggle, with statistics and recompute later).
