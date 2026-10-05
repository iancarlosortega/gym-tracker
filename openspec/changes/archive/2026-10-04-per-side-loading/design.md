# Design — per-side-loading

## 1. Model (domain)

- **D1 Optional base.** `Equipment` BARBELL spec becomes `{ kind: 'BARBELL', barGrams: Grams | null }`. The code name `BARBELL` and `barGrams` are kept, to avoid churn across the API, DB and web; the UI calls it "Plate-loaded" with "Bar or sled weight". `specFrom` accepts a missing bar. `withBarWeight(Grams | null)`: null clears it.
- **D2 Support.** `supports`: BARBELL → PER_SIDE | TOTAL; FREE_WEIGHT → **PER_SIDE** | TOTAL; STACK → STACK_POSITION.
- **D3 Load entry.** The PER_SIDE state is `{ perSideGrams, barGrams: Grams | null }`. `perSide(side, bar = null)`. `resolveMass` = 2·side + (bar ?? 0). `from()` reads a missing or null bar as null. `MissingBarWeightError` is no longer thrown for PER_SIDE.
- **D4 Snapshot.** The PER_SIDE snapshot `barGrams` must equal the entry's bar, and both may be null. The rule "PER_SIDE needs a snapshot bar" is removed. STACK still has no bar.
- **D5 Recompute.** Recompute uses `base = equipment.barGrams ?? 0` instead of skipping a null base, so clearing a base recomputes past sets to 2·side. The known drift (only `resolved_grams` is rewritten) is unchanged and out of scope.

## 2. Persistence and API

- **D6 Migration** `apps/api/drizzle/0001_optional_base_weight.sql`, hand-written: `DROP CONSTRAINT equipment_barbell_has_bar` and `DROP CONSTRAINT logged_set_per_side_has_bar`. No data is touched. Journal and snapshot are updated. The schema files drop the two `check()` calls.
- **D7 Equipment API.** `CreateEquipmentDto.barKilograms` stays optional, and a BARBELL without it is now valid. `CorrectBarWeightDto.barKilograms` is a `number | null` (null clears). The mappers write null.
- **D8 Logging.** `LogSetsUseCase` builds `LoadEntry.perSide(load, equipment.barGrams)` (null allowed) for any equipment whose `supports(mode)` is true. The snapshot bar is `equipment.barGrams` for PER_SIDE. The NaN path is removed.
- **D9 Unit.** `PATCH /auth/me { displayUnit: 'KG' | 'LB' }` calls `ChangeDisplayUnitUseCase`, which uses `User.preferring` and saves. The wire stays grams and kilograms; conversion happens only in the web.

## 3. Web

- **D10 Units at the edge.** `lib/units.ts`:
  - `toDisplay(kg, unit)` and `fromDisplay(value, unit) → Grams` (via `fromKilograms`/`fromPounds`);
  - `unitLabel(unit)` → kg/lb, `spokenUnit(unit)` → kilograms/pounds.
  - Display rounds to 0.1.
  - `useDisplayUnit()` reads `useMe()`, defaulting to KG.
- **D11 Labels.** The tile reads "Weight per hand" when the chosen equipment is FREE_WEIGHT and the mode is PER_SIDE, otherwise per side. Last time and done labels take the unit, and "/hand" or "/side" follows the current equipment.
- **D12 Mirrors.** `workout-plan.ts` `supports` and `kindsFor` follow D2. In `NewEquipmentForm`, the BARBELL card is "Plate-loaded" with an optional "Bar or sled weight" in the user's unit. Equipment views read "bar not counted" when the base is empty, and "Remove the bar weight" leads to recompute with null.
- **D13 Profile.** A lb | kg segmented toggle that calls `PATCH /auth/me` and invalidates `me`.

## 4. Testing (strict TDD)

- **Domain:** the D1–D5 scenarios, including the Smith (40), the Olympic bar (60), dumbbells (2·hand), and clearing (recompute).
- **API:** PGlite table test (a null-base per-side row is accepted); log-sets on Smith, dumbbells and hack squat; correct-bar with null; `PATCH /auth/me`.
- **Web:** units round trip (60 lb → 60.0 lb); form; labels; screen integration (dumbbells per hand in lb).
