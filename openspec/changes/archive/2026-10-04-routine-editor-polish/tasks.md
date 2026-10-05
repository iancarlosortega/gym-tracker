# Tasks — routine-editor-polish

Strict TDD. Commit the unit once its tests, typecheck, biome and build are green.

## S1 — Editor polish
- [x] 1.1 Generalise the list into `SortableList` (D1). The routine list keeps its tests.
- [x] 1.2 The editor's entries use `SortableList`. Done becomes text. Add `initiallyAdding` (D2). Covered by editor tests.
- [x] 1.3 The empty plan offers Add exercises, which opens the editor with the picker (D3). Covered by plan tests.

## Device verification
- [x] DV.1 Drag a routine's exercises by the handle, check Done looks right, and add exercises to an empty routine from its plan. Confirmed by Ian on the iPhone (2026-10-04).

## Review Workload Forecast
| Unit | ~Lines |
|---|---|
| S1 | ~200 |

- Chained PRs recommended: No.
- Decision needed before apply: No.
