# Exploration — gym-tracker-mvp

**Date**: 2026-09-19
**Change**: `gym-tracker-mvp`
**Phase**: explore (no implementation, no decisions settled)

## 1. Codebase State

The repository is empty. Not a git repository, zero source files, zero project markers. Nothing was read because nothing exists. Every statement below is derived from the user's request or from reasoning about the domain — none of it is derived from existing code.

## 2. Arithmetic Verification (user asked directly)

The user's per-side mental math is **correct**.

```
total = (per_side_load * 2) + bar_weight
      = (20 kg * 2) + 20 kg
      = 60 kg
```

This holds only while three assumptions hold, and each one must become explicit data rather than a hidden constant:

1. The bar weight is known. An Olympic barbell is commonly 20 kg, but short bars, EZ bars, trap bars, and Smith machines differ — and a Smith machine's carriage is partly counterbalanced, so its effective bar weight is frequently not its physical weight.
2. Loading is symmetric. The formula silently assumes it.
3. The "per side" convention is the user's own input convention, not a property of the exercise. It must be stored as such.

**Consequence for the model:** the number the user types is not the load. It is an *entry* in a *mode*. The load is computed from it. Storing only the typed number, or only the computed total, both lose information.

## 3. Domain Model — the core problem

This app's hard part is not authentication, routines, or charts. It is that **"weight" is at least three different kinds of quantity**, and two of them are not interchangeable.

### 3.1 Measurement modes

| Mode | What the user types | Scale type | Convertible to mass? |
|---|---|---|---|
| `TOTAL` | the whole load, e.g. dumbbell 22.5 kg | ratio (true mass) | yes |
| `PER_SIDE` | one side's load, e.g. 20 kg | ratio (true mass, derived) | yes, via `(x*2)+bar` |
| `STACK_POSITION` | a plate/pin ordinal, e.g. "plate 7" | **ordinal** | **no, not without calibration** |

The third row is the one that breaks naive designs. "Plate 7" is a position on a selectorized stack. It is an ordered label, not a mass. Plate 7 on the lat pulldown and plate 7 on the chest press are unrelated quantities, and the gap between plate 6 and plate 7 is not guaranteed to equal the gap between plate 7 and plate 8 (many stacks have a fixed increment, some have add-on micro-plates, and the top plate often differs).

### 3.2 What follows from that

- **Progress is comparable within one machine, not across machines.** Plate-based exercises can be trended over time per exercise. They cannot be summed into a cross-exercise total.
- **Global "total volume lifted this week" is invalid** if it naively adds plate ordinals to kilograms. This is the single most likely silent bug in the whole product. Statistics must either exclude ordinal exercises from mass-based aggregates, or use an explicitly-labelled estimate.
- **Optional escape hatch:** let the user calibrate a machine ("each plate ≈ 5 kg, first plate ≈ 10 kg"). Then plate ordinals map to estimated mass. This must be flagged as *estimated* everywhere it surfaces, and it must never be presented as a measured value.

### 3.3 History immutability — a decision that is easy to get wrong

If the user edits an equipment definition (corrects a bar from 20 kg to 15 kg, recalibrates a stack), does every past workout silently change its numbers?

Silently rewriting history is the wrong default: it invalidates past charts and quietly rewrites personal records. The safer shape is to store, on each logged set, both the raw entry (`value` + `mode`) and a snapshot of the resolution parameters used at log time (bar weight, unit, calibration). Recalibration then affects future entries, and past entries can be re-resolved deliberately and visibly. This is a real decision for the design phase, not a settled fact.

### 3.4 Unit handling

kg and lb both appear. Storing a single canonical unit internally (for example, grams as an integer) with a display preference avoids float drift and mixed-unit comparisons. Plate ordinals are unitless and must not be forced into that field.

### 3.5 Entities that fall out of the request

`User` · `Exercise` (owns its default measurement mode) · `Equipment` / `MachineProfile` (owns bar weight or stack calibration) · `Routine` → `RoutineExercise` (target sets/reps/rest) · `WorkoutSession` → `LoggedSet` (raw entry + mode + resolved load snapshot + reps + RPE?) · `PersonalRecord` (derived, per exercise, per mode).

## 4. Architectural Decision Points (surfaced, NOT settled)

1. **Two deployables or one.** Next.js + NestJS is two runtimes, two deploys, two cold-start surfaces, CORS, and duplicated auth wiring — for one user. Next.js route handlers alone would collapse this to one deployable. NestJS buys structure, DI, and a clean domain layer that suits this domain's complexity. Real tradeoff; the user stated a preference, which carries weight, but the cost should be stated before it is paid.
2. **Auth for exactly one human.** Full email/password + sessions + reset flows is a lot of machinery for a single account. Alternatives range from a hosted provider's free tier to a single-account passkey. Cost, lock-in, and iOS behaviour differ.
3. **Database.** Relational fits this domain (sessions, sets, routines are heavily relational and query-shaped for stats). The choice of *provider* is a cost question, not a modelling question.
4. **Hosting.** NestJS is a long-running Node service; where it runs cheaply, and whether it sleeps on idle, directly affects gym-floor usability (a cold start while standing at the rack is a real UX failure).
5. **PWA vs. plain web.** Raised explicitly by the user. Affects install, offline, and — critically — the rest timer.
6. **Offline-first or not.** Gym basements have poor signal. If logging fails mid-workout the app is worthless at the exact moment it matters. Offline capture with later sync is a significant architectural commitment and should be decided deliberately, not discovered late.
7. **Rest timer delivery on iOS.** A timer that only works while the app is foregrounded and the screen is awake is a different product from one that alerts you with the phone in your pocket. This is the highest-risk unknown in the whole request.

## 5. Research Lanes (external evidence required — NOT answered here)

Each lane states the exact question. Nothing below is answered from recall; current platform and pricing facts change and must be sourced.

- **R1 — iOS PWA capability (iOS 26-era, iPhone 16 Pro Max).** What can an installed PWA on current iOS actually do: home-screen install, service-worker offline, storage persistence and eviction rules, Web Push / Notifications API support and whether it requires installation, background timer behaviour when backgrounded or screen-locked, and Wake Lock support. **UNVERIFIED.**
- **R2 — Rest-timer delivery on iOS.** Given R1, what mechanisms can actually fire a 3-minute alert with the phone pocketed: scheduled Web Push, local notification equivalents, audio-session keep-alive, Live Activities availability to web apps, or none. **UNVERIFIED.**
- **R3 — Cheap hosting for a long-running NestJS service.** Current free and low-cost tiers, idle-sleep and cold-start behaviour, and real monthly cost at single-user traffic. **UNVERIFIED.**
- **R4 — Cheap managed Postgres-class database.** Current free tiers, row/storage caps, idle suspension behaviour and its latency cost, and backup policy. **UNVERIFIED.**
- **R5 — Next.js latest version.** The actual current major/minor, its routing and caching defaults, and any migration-relevant changes. The user asked for "last version" and that must be a verified number, not an assumption. **UNVERIFIED.**

## 6. Open Product Decisions (only the user can answer)

- **P1 — Offline logging.** Required at MVP, or acceptable to require signal?
- **P2 — Rest timer.** Must it alert with the phone in a pocket / screen locked, or is an on-screen countdown while the app is open enough?
- **P3 — Plate calibration.** Keep plate counts purely ordinal (honest, no fake kilograms), or allow optional per-machine calibration to estimate mass?
- **P4 — Cross-exercise statistics.** Should mass-based aggregates exclude plate-mode exercises, or include them as clearly-labelled estimates?
- **P5 — Two deployables.** Keep Next.js + NestJS as stated, or collapse to a single Next.js deployable to cut hosting cost and operational surface?
- **P6 — Auth scope.** Single hard-coded account, or a real multi-user-capable auth system from day one?
- **P7 — History on recalibration.** When equipment is corrected, do past workouts keep their original numbers or get re-resolved?

## 7. Risks

| ID | Risk | Severity |
|---|---|---|
| RK1 | Mixing ordinal plate counts with kilograms in aggregate statistics produces numbers that look right and are meaningless. | CRITICAL |
| RK2 | Rest timer may be undeliverable on iOS in the backgrounded/locked case; a core stated feature could be technically blocked. | HIGH |
| RK3 | Cold starts on a cheap sleeping host make gym-floor logging painful at the exact moment of use. | HIGH |
| RK4 | Two deployables for one user multiplies hosting cost and operational surface against an explicit cheapness constraint. | MEDIUM |
| RK5 | Editing equipment definitions could silently rewrite historical records and invalidate personal bests. | MEDIUM |
| RK6 | Poor gym signal makes an online-only logger unreliable during its only real use case. | MEDIUM |

## 8. Status

Exploration complete. No decision settled, no code written. The proposal is **blocked** until research lanes are selected/completed and the product decisions above are confirmed.
