# Archive report — per-side-loading

Archived 2026-10-04. Verify verdict: **pass_with_warnings** (envelope validated, 6/6 requirements, 10/10 scenarios, evidence revision sha256:519f2582…78a8).

## Specs synced to `openspec/specs/`
- `catalog`, `workout-logging`: composed with `gentle-ai sdd-archive-compose` (exit 0). The delta headings were corrected from MODIFIED to ADDED first, since every requirement name is new (commit "label per-side loading requirements as added").
- `display-unit`: new; copied mechanically (`diff` empty).

## Final state
- Tasks 1.1–3.3 are complete. Ian confirmed on the device: the lb switch, creating plate-loaded and free-weight equipment, and the skeleton/offline behaviour.
- Discoveries fixed: a NaN crash logging per side on a non-barbell; the null bar read as 0 g in three mappers; the web had no way to change a bar weight.
- Out of scope / follow-up: progress charts and the recompute screen in lb.
