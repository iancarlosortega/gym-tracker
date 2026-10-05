# Tasks — per-side-loading

Strict TDD. Each unit is committed when green (tests, typecheck, biome, build).

## 1 — Domain
- [x] 1.1 `Equipment`: optional base for BARBELL (D1), FREE_WEIGHT supports PER_SIDE (D2), `withBarWeight(null)`. Update the pinned tests.
- [x] 1.2 `LoadEntry` / `LoggedSet`: optional per-side base (D3, D4); resolve 2·side + (base ?? 0).
- [x] 1.3 Recompute with a cleared base (D5).

## 2 — API
- [x] 2.1 Migration 0001 dropping the two checks (D6); schema; the table test accepts a null-base per-side row.
- [x] 2.2 Equipment: create without a base, correct the bar with null (D7). Log-sets per side on any supporting equipment (D8). Tests.
- [x] 2.3 `PATCH /auth/me` display unit (D9). Tests.

## 3 — Web
- [x] 3.1 `lib/units.ts` + `useDisplayUnit` (D10); the Profile lb | kg toggle (D13).
- [x] 3.2 Equipment form, views and `supports` mirror (D12).
- [ ] 3.3 Workout screen: entry in the unit, per hand / per side labels, last time and done in the unit (D10, D11).

## Review Workload Forecast
| Unit | ~Lines |
|---|---|
| 1 | ~250 |
| 2 | ~300 |
| 3 | ~450 |
Chained slices: yes (auto-chain, commits to main).
