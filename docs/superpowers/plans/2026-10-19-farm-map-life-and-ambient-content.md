# Farm Map Life and Ambient Content Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Populate the stable with real project horses, then enrich the full farm with approved environmental details and restrained ambient motion without adding gameplay or backend behavior.

**Architecture:** Keep horse assignment and motion decisions in pure modules under `src/hub/`, and keep Canvas drawing in focused render modules. Reuse S01/S06/S07/S08/S13/S15 wherever possible; genuinely new wildlife or props go into a separate S16 approval sheet and cannot enter runtime assets until the user approves its preview. Static density remains part of the generated sprite-only map, while state-dependent horses, workers, vehicles, and wildlife remain runtime overlays.

**Tech Stack:** React 19.2, TypeScript 6 strict, Canvas 2D, CSS Modules, Node 24 `node --test`, code-generated PNG sprite sheets, Aseprite 1.3.18 map compositor.

**Spec:** `HANDOVER.md` (ADR-3 through ADR-12 and sections 2/6), `tasks/plan-hayday.md`, and the user-confirmed intent from 2026-10-19 captured in Global Constraints below.

## Global Constraints

- Implement the approved horse-in-stall direction first, then enrich the rest of the 1280×768 farm.
- Reuse approved sprites before creating anything new.
- Every genuinely new sprite must be shown as a preview and explicitly approved before being copied into `public/assets/`, added to the map allowlist, or rendered at runtime.
- Preserve the current pixel-art style: 32×32 cells, 192×192 sheets, transparent background, nearest-neighbor rendering, foot baseline y=30, and the approved SRS §12 palette.
- The generated map may only crop/copy/place approved sprites; it may not scale, rotate, draw primitives, add text, or use concept images.
- Keep the existing 1280×768 M1 layout, building positions, hit areas, camera behavior, and Vietnamese user-facing copy.
- Add no dependency.
- Ambient additions are visual only: no new gameplay, inventory rules, health effects, database writes, backend integration, or automatic Medical Lock behavior.
- Preserve `RULE-MED-01`, `RULE-RBAC-01`, `RULE-AI-01`, and `RULE-CONC-01`; do not resolve the documented RULE-MED-02/ADR-3 conflict in this work.
- Movement must stop or become a static pose under `prefers-reduced-motion`; delivery icons must not fly in reduced-motion mode.
- Maintain at least 55 fps at 1920×1080 with a popup open, matching the existing T11 acceptance target.
- Do not initialize git as part of this plan. Commit steps apply only if `Racehorse_Simulator_Web/` has been placed in a git repository before execution.

## Recommended Content

| Zone | Use approved assets now | New sample requiring approval |
|---|---|---|
| Stable | Real horse heads in seven visible barred stalls; coat colors from each `HorseProfile`; groom, loaded barrow, hay, feed and water troughs | Hanging tack set only if the approved S07 equipment is not visually sufficient |
| Paddock | Two real walking/grazing horses, water trough, rocks, weeds, flowers, hay, subtle hoof/dust effects | Two-frame butterflies and a small perched/flying bird |
| Track | Existing mounted horses, dust, track markers, one trainer/groundskeeper at the perimeter | Windsock only if existing banners do not read clearly at normal zoom |
| Supply barn | Existing sacks, hay, loaded barrow, delivery truck and cart | No new asset initially |
| Clinic | Existing veterinarian, cross sign, shrubs, rocks and one waiting owner | No new asset initially |
| House/garden/entrance | Existing manager/owner, flower bushes, well, cart and fence details | Idle/walking barn cat |

The high-value new S16 candidates are therefore: bird, butterfly, barn cat, and—only if needed after the existing-asset pass—tack rack or windsock. Chickens, generic livestock, large decorative buildings, weather systems, and UI captions are intentionally excluded because they dilute the racehorse-stable focus or add scope without improving the demo story.

## Review Focus

- Medical Lock changes must not make an unaffected paddock horse jump to another path or change coat/name mid-step; Task 1 pins stable slot assignment by horse identity/stall.
- Stall horses must stay behind the original bars and lower door at every animation frame and coat; Task 2 adds pixel clipping and render-order tests plus a full-map approval screenshot.
- Added static props must not cover roads, track lanes, gates, interactive building pixels, or horse paths; Task 3 validates reserved corridors and performs hit-testing/browser checks.
- Reduced-motion mode must freeze ambient paths, suppress dust/flying delivery icons, and retain only static poses/fades; Tasks 4 and 6 test this explicitly.
- New S16 content must never reach runtime or the generated map before explicit human approval; Tasks 5 and 6 separate preview generation from integration and test the asset allowlist.

---

### Task 1: Deterministic Real-Horse Population

**Files:**
- Create: `src/hub/farmPopulation.ts`
- Create: `src/hub/farmPopulation.test.ts`
- Modify: `src/ui/FarmHub.tsx:44-67`
- Modify: `src/ui/FarmMapCanvas.tsx:24-40,42-61,143-146,198-204,279-307`
- Modify: `src/hub/paths.ts:28-56`
- Modify: `src/hub/paths.test.ts:1-14`

**Interfaces:**
- Consumes: `HorseProfile.id`, `HorseProfile.coat`, `HorseProfile.health`, `HorseProfile.medicalLock`, and `HorseProfile.stall`.
- Produces: `assignPaddockHorses(horses: readonly HorseProfile[]): readonly (HorseProfile | null)[]`, exactly `PADDOCK_SLOTS` entries; `assignStableHorses(horses: readonly HorseProfile[], paddockIds: ReadonlySet<string>): readonly StableHorseAssignment[]`; `StableHorseAssignment = { horse: HorseProfile; anchor: StableStallAnchor }`.
- Produces: `VISIBLE_STABLE_STALLS`, seven immutable anchors corresponding to the open S07 `(0,1)` tiles at world cells `(0,1)`, `(4,1)`, `(6,1)`, `(3,4)`, `(5,4)`, `(9,4)`, and `(11,4)`.

- [ ] **Step 1: Write failing deterministic-assignment tests**

```ts
test("locking one paddock horse preserves the unaffected horse's slot", () => {
  const before = assignPaddockHorses(seedHorses());
  const locked = seedHorses().map((horse) => horse.id === "HRS-001" ? { ...horse, medicalLock: true } : horse);
  const after = assignPaddockHorses(locked);
  assert.equal(before[1]?.id, "HRS-002");
  assert.equal(after[1]?.id, "HRS-002");
  assert.notEqual(after[0]?.id, "HRS-001");
});

test("a horse uses the visible stable anchor derived from its stall and is never duplicated", () => {
  const horses = seedHorses();
  const paddock = assignPaddockHorses(horses);
  const stable = assignStableHorses(horses, new Set(paddock.flatMap((horse) => horse ? [horse.id] : [])));
  assert.equal(new Set(stable.map(({ horse }) => horse.id)).size, stable.length);
  assert.ok(stable.every(({ horse }) => !paddock.some((candidate) => candidate?.id === horse.id)));
});
```

- [ ] **Step 2: Run the focused tests and verify they fail**

Run: `node --test src/hub/farmPopulation.test.ts src/hub/paths.test.ts`

Expected: FAIL because `farmPopulation.ts` and the assignment functions do not exist.

- [ ] **Step 3: Implement stable paddock and stable assignment**

Implement `assignPaddockHorses` using two identity-stable lanes: eligible horses are `!medicalLock && (health === "FIT" || health === "WATCH")`; each horse prefers `(stall.row * 6 + stall.col) % PADDOCK_SLOTS`, and only fills another empty slot when its preferred slot is occupied. Sort candidates by numeric stall index before assigning. Implement visible stable anchors as the seven exact cells above; a horse is visible in the stable only when its numeric stall index is 0–6 and it is not currently assigned to the paddock.

- [ ] **Step 4: Replace filtered/compacted paddock arrays in the UI**

`FarmHub` must compute assignments with `useMemo`, pass the fixed two-entry tuple to `FarmMapCanvas`, and pass stable assignments separately. `FarmMapCanvas` hit testing and hover tags must tolerate `null` paddock slots and still call `onHorse` with the correct id.

- [ ] **Step 5: Run focused tests**

Run: `node --test src/hub/farmPopulation.test.ts src/hub/paths.test.ts`

Expected: PASS with no horse duplicated between visible stable and paddock slots.

- [ ] **Step 6: Run typecheck**

Run: `npm run typecheck`

Expected: exit 0 with no TypeScript errors.

- [ ] **Step 7: Commit if a Simulator git repository exists**

```bash
git add src/hub/farmPopulation.ts src/hub/farmPopulation.test.ts src/hub/paths.ts src/hub/paths.test.ts src/ui/FarmHub.tsx src/ui/FarmMapCanvas.tsx
git commit -m "feat: assign farm horses to stable map slots"
```

If `.git/` does not exist, do not initialize it; record the completed files in the execution handoff.

---

### Task 2: Render Approved Horses Inside Stable Openings

**Files:**
- Create: `src/render/stableHorses.ts`
- Create: `src/render/stableHorses.test.ts`
- Modify: `src/render/sprites.ts:13-27,177-192`
- Modify: `src/hub/ambient.ts:1-49`
- Modify: `src/ui/FarmMapCanvas.tsx:143-149`
- Retire after parity is proven: `art/preview/build-stall-horse-sample.ps1`
- Keep as approval evidence: `art/preview/samples/stall-with-horse-sample.png`
- Keep as approval evidence: `art/preview/samples/stall-with-horse-sample-x8.png`

**Interfaces:**
- Consumes: Task 1 `StableHorseAssignment[]`; existing `Sprites.horse`; new `Sprites.stall` loaded from `/assets/sprites/s07-stall.png`; `tinted()` and `drawFrame()`.
- Produces: `stableHorseFrame(time: number, reducedMotion: boolean, phase: number): 0 | 1 | 2`; `drawStableHorses(ctx: CanvasRenderingContext2D, sprites: Sprites, assignments: readonly StableHorseAssignment[], time: number, reducedMotion: boolean): void`.

- [ ] **Step 1: Write failing frame and geometry tests**

```ts
test("reduced motion fixes every stable horse on idle frame zero", () => {
  for (const time of [0, 1, 10, 100]) assert.equal(stableHorseFrame(time, true, 2), 0);
});

test("stable horse animation uses only approved idle frames", () => {
  for (const time of [0, 0.5, 1, 2]) assert.ok([0, 1, 2].includes(stableHorseFrame(time, false, 1)));
});

test("all visible stall openings are unique 32px cells inside the stable object", () => {
  assert.equal(new Set(VISIBLE_STABLE_STALLS.map(({ x, y }) => `${x},${y}`)).size, 7);
  assert.ok(VISIBLE_STABLE_STALLS.every(({ x, y }) => x >= 0 && x < 384 && y >= 32 && y < 160));
});
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run: `node --test src/render/stableHorses.test.ts`

Expected: FAIL because `stableHorses.ts` does not exist.

- [ ] **Step 3: Load S07 as an approved runtime sheet**

Add `stall: Sheet` to `Sprites`; load `/assets/sprites/s07-stall.png` with `pixelSheet`. Do not add another image dependency or create a new official sprite sheet for the approved barn sample.

- [ ] **Step 4: Implement clipped horse rendering and foreground-bar restoration**

For each stable assignment, clip drawing to the approved sample's upper opening (`anchor.x + 9` through `anchor.x + 25`, `anchor.y + 4` through `anchor.y + 12`), draw the tinted S01 idle head/neck at native 1:1 world scale, then copy the original S07 side posts, remaining bars, and horizontal rail over it. The lower half-door and stable building image remain untouched. Use only frames 0–2; offset phase by stable slot so horses do not move in sync.

- [ ] **Step 5: Insert the stable-horse layer after the stable object and before free-moving actors**

Extend the `drawFarmScene` actor callback or split it into explicit `afterBuildings` layers so the order is: ground → buildings → clipped stable horses with restored bars → paddock horses/people/vehicles → night overlay. Do not change object bounds or hit masks.

- [ ] **Step 6: Run tests and generate a full-map approval screenshot**

Run: `node --test src/render/stableHorses.test.ts src/render/farmScene.test.ts && npm run typecheck`

Expected: all tests PASS and typecheck exits 0. Browser-check at default zoom that horse faces are readable, remain inside stalls, use the correct coat, and do not intercept stable clicks.

- [ ] **Step 7: Human approval checkpoint**

Show one close-up screenshot and one full-map screenshot. Stop and request explicit approval before proceeding to the whole-map enrichment tasks. If placement is rejected, adjust only clipping/anchor offsets; do not redraw the horse.

- [ ] **Step 8: Commit if git exists**

```bash
git add src/render/stableHorses.ts src/render/stableHorses.test.ts src/render/sprites.ts src/hub/ambient.ts src/ui/FarmMapCanvas.tsx art/preview/samples
git commit -m "feat: show real horses inside stable stalls"
```

---

### Task 3: Enrich the Static Map with Existing Approved Props

**Files:**
- Modify: `art/map/gen-layout.ts:70-222`
- Modify generated: `art/map/farm-layout.json`
- Modify generated: `art/aseprite/farm-day.aseprite`
- Modify generated: `art/preview/farm-day-x1.png`
- Modify generated: `public/assets/maps/farm-ground.png`
- Modify generated: `public/assets/maps/objects/*.png` only when the corresponding object composition changes
- Modify: `src/hub/farmLayout.ts:26-106`
- Modify: `src/hub/farmLayout.test.ts:10-59`

**Interfaces:**
- Consumes: existing S07/S08/S10/S15 tiles and the current `place`, `decor`, and `building` helpers.
- Produces: `RESERVED_CORRIDORS: readonly Rect[]` and `validateDecorCorridors(): true` in `farmLayout.ts`; no new interactive object or `FarmTarget`.

- [ ] **Step 1: Write failing corridor and asset-reuse tests**

Add assertions that loose `decor` placements do not overlap the main road row 18, stable approach row 8 columns 0–7, paddock horse paths, track lanes, building bounds, or the entrance gate at cells `(5..7,22)`. Assert that every new placement still references `ALLOWED_MAP_SHEETS` and that `FARM_OBJECTS` remains exactly `{ stable, track, barn, vet }`.

- [ ] **Step 2: Run the focused layout tests and verify they fail**

Run: `node --test src/hub/farmLayout.test.ts`

Expected: FAIL because `RESERVED_CORRIDORS` and `validateDecorCorridors` do not exist.

- [ ] **Step 3: Add the approved-prop pass by zone**

Add these exact 32×32 placements, moving a placement only if the corridor test proves overlap:

| Zone | Sheet crop | Destination cell |
|---|---|---|
| Stable side yard | S07 feed trough `(0,2)` | `(12,2)` |
| Stable side yard | S07 water trough `(4,2)` | `(12,3)` |
| Stable side yard | S08 weeds `(3,5)` | `(14,5)` |
| Paddock edge | S07 water trough `(4,2)` | `(23,8)` |
| Paddock edge | S08 rocks `(4,5)` | `(23,14)` |
| Paddock edge | S08 weeds `(3,5)` | `(10,14)` |
| Track perimeter | S08 flower bush `(3,2)` | `(18,9)` |
| Track perimeter | S08 bush `(2,2)` | `(38,9)` |
| House garden | S08 flower bush `(3,2)` | `(28,14)` |
| House garden | S08 bush `(2,2)` | `(36,14)` |
| Supply yard | S08 sacks `(1,3)` | `(17,20)` |
| Supply yard | S08 hay stack `(0,3)` | `(25,20)` |
| Clinic edge | S08 flower bush `(3,2)` | `(32,22)` |
| Clinic edge | S08 rocks `(4,5)` | `(38,22)` |

Do not add props to the track surface or central paddock horse lanes. These placements are visual-only and must not become clickable objects.

- [ ] **Step 4: Regenerate and verify the map**

Run from `Racehorse_Simulator_Web/`:

```powershell
node art/map/gen-layout.ts
Start-Process -FilePath $ase -ArgumentList '-b','--script-param',"root=$PWD",'--script','art/aseprite/build-farm-map.lua' -NoNewWindow -Wait
npm run verify:map
```

Expected: `farm-layout.json` reports successful generation; `verify:map` verifies every generated PNG against the nine approved sheets.

- [ ] **Step 5: Run layout tests and inspect at normal zoom**

Run: `node --test src/hub/farmLayout.test.ts`

Expected: PASS. In the browser, every road, gate, building, paddock horse, and track lane remains visually unobstructed and clickable.

- [ ] **Step 6: Commit if git exists**

```bash
git add art/map art/aseprite/farm-day.aseprite art/preview/farm-day-x1.png public/assets/maps src/hub/farmLayout.ts src/hub/farmLayout.test.ts
git commit -m "feat: enrich farm map with approved props"
```

---

### Task 4: Structured Ambient Actors and Reduced Motion

**Files:**
- Create: `src/hub/ambientScene.ts`
- Create: `src/hub/ambientScene.test.ts`
- Modify: `src/hub/ambient.ts:1-67`
- Modify: `src/hub/paths.ts:1-78`
- Modify: `src/hub/paths.test.ts:1-23`
- Modify: `src/ui/FarmMapCanvas.tsx:65-171,305-339`

**Interfaces:**
- Consumes: Task 1 population assignments; existing `along`; existing S06/S13/S15; `speed`; `inventory.HAY`; delivery trip.
- Produces: `AmbientSceneState = { reducedMotion: boolean; simulationRunning: boolean; hasHay: boolean }`; `ambientActorPose(actor: AmbientActorId, time: number, state: AmbientSceneState): AmbientPose`; `barrowActive(state: AmbientSceneState): boolean`.
- `AmbientActorId` is exactly `"TRACK_RIDER_1" | "TRACK_RIDER_2" | "STABLE_GROOM" | "CLINIC_VET" | "HOUSE_MANAGER" | "HOUSE_OWNER" | "SUPPLY_BARROW" | "HOUSE_CART"`.

- [ ] **Step 1: Write failing scene-state tests**

```ts
test("loaded barrow moves only while simulation runs and hay remains", () => {
  assert.equal(barrowActive({ reducedMotion: false, simulationRunning: true, hasHay: true }), true);
  assert.equal(barrowActive({ reducedMotion: false, simulationRunning: false, hasHay: true }), false);
  assert.equal(barrowActive({ reducedMotion: false, simulationRunning: true, hasHay: false }), false);
});

test("reduced motion returns a stable pose for every ambient actor", () => {
  for (const id of AMBIENT_ACTOR_IDS) {
    assert.deepEqual(ambientActorPose(id, 0, reducedState), ambientActorPose(id, 99, reducedState));
  }
});
```

- [ ] **Step 2: Run the focused tests and verify they fail**

Run: `node --test src/hub/ambientScene.test.ts src/hub/paths.test.ts`

Expected: FAIL because the structured ambient scene API does not exist.

- [ ] **Step 3: Move route data and pose selection out of Canvas rendering**

Move route constants from `ambient.ts` into `ambientScene.ts`. Keep the current riders, groom, vet, manager, loaded barrow, and cart; add the existing owner sprite as a slow walker in the house garden. Pure pose functions decide x/y/direction/frame. `ambient.ts` only selects the approved source frame and draws it.

- [ ] **Step 4: Wire real simulation and accessibility state**

Pass `simulationRunning={speed > 0}`, `hasHay={inventory.stock.HAY > 0}`, and a live `prefers-reduced-motion` media-query value from `FarmHub` through `FarmMapCanvas`. When reduced motion is on: freeze people/horses/vehicles on standing frames, suppress dust and firefly travel, and skip delivery-item flight while preserving the inventory number update and fades.

- [ ] **Step 5: Fix the existing delivery and barrow gaps as part of the same state contract**

`drawDelivery` receives `reducedMotion`; it still draws the parked/open truck but never draws the flying supply icon in reduced mode. The loaded barrow and its groom are not drawn while paused or while hay is empty.

- [ ] **Step 6: Run focused and full tests**

Run: `node --test src/hub/ambientScene.test.ts src/hub/paths.test.ts && npm test && npm run typecheck`

Expected: all tests PASS; typecheck exits 0.

- [ ] **Step 7: Browser-check day, night, pause, empty hay, and reduced motion**

Expected: restrained motion at normal settings; no moving ambient actors or flying item icons with reduced motion; inventory delivery still completes; no console error.

- [ ] **Step 8: Commit if git exists**

```bash
git add src/hub/ambientScene.ts src/hub/ambientScene.test.ts src/hub/ambient.ts src/hub/paths.ts src/hub/paths.test.ts src/ui/FarmHub.tsx src/ui/FarmMapCanvas.tsx
git commit -m "feat: structure ambient farm activity"
```

---

### Task 5: Generate the New-Life Approval Sheet Without Runtime Integration

**Files:**
- Create: `art/gen/ambient-life.ts`
- Create: `art/gen/ambient-life.test.ts`
- Create preview-only: `art/preview/s16-ambient-life-x4.png`
- Create preview-only: `art/preview/s16-ambient-life-context.png`
- Do not create yet: `public/assets/sprites/s16-ambient-life.png`
- Do not modify yet: `src/render/sprites.ts`, `src/hub/farmLayout.ts`, `art/aseprite/build-farm-map.lua`

**Interfaces:**
- Consumes: `Img`, `sheet`, `outline`, `preview`, and SRS §12-compatible colors from `art/gen/pixel.ts` and existing generators.
- Produces preview frames only: row 0 bird (`idle ×2`, `hop ×2`, `fly ×2`); row 1 barn cat (`idle ×2`, `walk ×2`, `stretch ×2`); row 2 butterfly (`rest ×2`, `fly ×4`); row 3 optional track windsock (`calm ×2`, `breeze ×4`); rows 4–5 transparent/reserved.

- [ ] **Step 1: Write failing sheet-contract tests**

Test that the generated in-memory sheet is exactly 192×192, all nontransparent pixels come from the declared SRS-compatible palette, frames stay inside their 32×32 cells, and footed animals use baseline y=30.

- [ ] **Step 2: Run the generator test and verify it fails**

Run: `node --test art/gen/ambient-life.test.ts`

Expected: FAIL because the generator does not exist.

- [ ] **Step 3: Generate preview-only S16 artwork**

Build the four rows above with code-native pixel primitives. Generate the ×4 sheet and a context board that places: bird at paddock fence, butterfly by garden flowers, cat near the supply barn, windsock outside the track. Do not copy the PNG into `public/assets` and do not add S16 to any allowlist.

- [ ] **Step 4: Run the generator tests**

Run: `node --test art/gen/ambient-life.test.ts`

Expected: PASS with sheet dimensions and palette constraints verified.

- [ ] **Step 5: Human approval checkpoint**

Show both preview files and ask for explicit approval per row: bird, cat, butterfly, windsock. Record approved/rejected rows. Stop here until the user responds; rejected rows remain preview-only and must not be integrated.

- [ ] **Step 6: Commit preview work if git exists**

```bash
git add art/gen/ambient-life.ts art/gen/ambient-life.test.ts art/preview/s16-ambient-life-x4.png art/preview/s16-ambient-life-context.png
git commit -m "art: propose ambient farm life sprites"
```

---

### Task 6: Integrate Only Explicitly Approved S16 Rows

**Files:**
- Create after approval: `art/png/s16-ambient-life.png`
- Create after approval: `public/assets/sprites/s16-ambient-life.png`
- Create after approval: `art/preview/provenance/s16-ambient-life.png`
- Modify: `src/render/sprites.ts:13-27,177-192`
- Modify: `src/render/farmAssets.ts:3-14`
- Modify: `src/hub/ambientScene.ts`
- Modify: `src/hub/ambientScene.test.ts`
- Modify: `src/hub/ambient.ts`
- Modify only if an approved static S16 frame enters the baked map: `src/hub/farmLayout.ts`, `art/aseprite/build-farm-map.lua`, `art/verify-farm-map.mjs`

**Interfaces:**
- Consumes: approved row ids recorded at Task 5's checkpoint.
- Produces: `Sprites.ambientLife: Sheet` only when at least one S16 row is approved; additional `AmbientActorId` members only for approved animated rows.

- [ ] **Step 1: Write an allowlist regression test before copying the asset**

Assert that runtime URLs cannot contain `s16-ambient-life.png` unless the approved-row manifest exported by `ambient-life.ts` is nonempty. Assert rejected row ids never appear in `AMBIENT_ACTOR_IDS` or map placements.

- [ ] **Step 2: Run the test and verify it fails only for the intended missing integration**

Run: `node --test art/gen/ambient-life.test.ts src/hub/ambientScene.test.ts src/render/farmScene.test.ts`

Expected: FAIL because approved S16 output has not yet been copied/loaded.

- [ ] **Step 3: Publish and load only the approved rows**

Write rejected rows as transparent cells in the official sheet. Copy the generated official PNG to `public/assets/sprites/`; load it in `Sprites`. Place bird near paddock fences, butterfly near garden flowers, cat on the supply/house path, and windsock outside—not inside—the race track, but only for rows explicitly approved in Task 5.

- [ ] **Step 4: Respect reduced motion**

Use idle frame 0 for every approved S16 actor when reduced motion is enabled. Do not draw dust or travel effects for those actors.

- [ ] **Step 5: Extend provenance only if S16 enters the baked map**

If all approved S16 content stays in runtime Canvas overlays, leave the map allowlist unchanged. If a static approved frame is baked into the map, add `s16-ambient-life` consistently to `ALLOWED_MAP_SHEETS`, the Aseprite allowlist, provenance normalization, and `verify-farm-map.mjs`; then regenerate the map.

- [ ] **Step 6: Run focused and map verification**

Run: `node --test art/gen/ambient-life.test.ts src/hub/ambientScene.test.ts src/render/farmScene.test.ts && npm run verify:map`

Expected: all tests PASS; map verification still reports only approved sheet-derived pixels.

- [ ] **Step 7: Commit if git exists**

```bash
git add art/gen/ambient-life.ts art/png/s16-ambient-life.png art/preview/provenance/s16-ambient-life.png public/assets/sprites/s16-ambient-life.png src/render src/hub art/aseprite/build-farm-map.lua art/verify-farm-map.mjs
git commit -m "feat: add approved ambient life sprites"
```

---

### Task 7: Whole-Map Verification, Performance, and Handover

**Files:**
- Modify: `tasks/todo-hayday.md`
- Modify: `HANDOVER.md`
- Modify only if usage/build instructions changed: `README.md`

**Interfaces:**
- Consumes: Tasks 1–6 deliverables and approval records.
- Produces: updated handover status and final evidence; no runtime interface.

- [ ] **Step 1: Run the full automated gate**

Run:

```powershell
npm run typecheck
npm test
npm run build
npm run verify:map
```

Expected: zero type errors, all Node tests pass, Vite build exits 0, and map verification succeeds.

- [ ] **Step 2: Perform browser acceptance at both required viewport sizes**

Check `1280×720` and `1920×1080`: pan/zoom, hover/click stable/track/clinic/supply, click both paddock horses, toggle one Medical Lock, pause/resume simulation, empty/replenish hay, place a delivery order, toggle day/night, and enable reduced motion. Expected: no console errors; no horse identity jump; no blocked hit target; no technical labels; approved ambience only.

- [ ] **Step 3: Measure performance in a visible browser tab**

Measure at `1920×1080` for at least 10 seconds with one popup open and normal motion. Expected: average ≥55 fps and no sustained frame longer than 22 ms. If below target, reduce simultaneous ambient actors before changing sprite resolution or visual quality.

- [ ] **Step 4: Capture final evidence**

Capture: stable close-up, full day map, full night map, reduced-motion frame, and the S16 approved/rejected record. Compare the full-map captures against the pre-change `art/preview/farm-day-x1.png` to confirm richer density without crowding roads or track lanes.

- [ ] **Step 5: Update task and handover documents**

Mark the completed ambient work, list any rejected preview rows as intentionally excluded, record the exact verification counts, and preserve the unresolved RULE-MED-02/ADR-3 conflict without changing either rule.

- [ ] **Step 6: Final commit if git exists**

```bash
git add tasks/todo-hayday.md HANDOVER.md README.md
git commit -m "docs: record farm ambience verification"
```

## Self-Review Results

- **Spec coverage:** Barn horses, full-map density, restrained ambient motion, approval gates, reduced motion, performance, provenance, and non-goals are each owned by a task.
- **Step scan:** Each implementation step names exact files, interfaces, values, or checks; approval checkpoints deliberately stop before unapproved sprite publication.
- **Type consistency:** `assignPaddockHorses`, `assignStableHorses`, `StableHorseAssignment`, `AmbientSceneState`, and `ambientActorPose` are defined once and consumed under the same names.
- **Review Focus:** Identity stability, stall clipping, corridor safety, reduced motion, and approval provenance each have a corresponding test or browser gate.
- **Proportion:** The plan is split into seven independently reviewable slices; S16 can be rejected entirely without invalidating Tasks 1–4.
