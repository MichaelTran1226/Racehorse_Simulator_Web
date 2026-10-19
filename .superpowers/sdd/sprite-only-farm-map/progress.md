# SDD ledger — plan: tasks/plan.md

Setup: Native execution approved; spec `SPEC-sprite-farm-map.md` is authoritative.
Ruling: no isolated worktree or task commits — this workspace is not a Git repository, so task checkpoints use fresh tests/builds instead; cost if wrong: no commit-level rollback inside this simulator directory.
Pre-flight: Task 1 layout feeds Tasks 2, 3, 5 and 6; shared names are `FARM_WORLD`, `FARM_OBJECTS`, `FARM_PLACEMENTS` and validated JSON.
Pre-flight: Task 2 outputs feed Tasks 3 and 5; runtime asset paths are `/assets/maps/farm-ground.png` and `/assets/maps/objects/<id>.png`.
Pre-flight: Tasks 4 and 5 feed Task 6 with camera and hit-test functions exactly as named in the plan.
Ruling: `art/map/farm-layout.json` may use repeat regions expanded into placements — otherwise a 64×48 grass field would require thousands of hand-authored duplicate records; every expanded placement still obeys exact crop/copy provenance; cost if wrong: Lua and TypeScript expanders could diverge, so both will be checked against the same dimensions/counts.
Task 1: complete (tests: `npm test` → 12/12 pass; `npm run typecheck` → pass).
