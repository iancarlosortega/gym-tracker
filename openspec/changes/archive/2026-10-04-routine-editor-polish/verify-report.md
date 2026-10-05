# Verify report — routine-editor-polish

**Verdict**: PASS. 2 requirements and 4 scenarios. Verified 2026-10-04.

| Requirement | Evidence |
|---|---|
| A routine's exercises reorder by drag or by one-step moves | `routine-editor.test.tsx` covers one-step moves, a handle-only drag with the row still editable, and Done as plain text. Device: DV.1. |
| An empty routine offers adding exercises | `routine-views.test.tsx` covers "No exercises yet." with Add exercises. `routine-editor.test.tsx` covers `initiallyAdding`. Device: DV.1. |

## Checks
- All 435 web tests pass.
- Typecheck, biome and `next build` are clean.
