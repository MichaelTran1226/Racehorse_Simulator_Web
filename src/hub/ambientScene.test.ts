import assert from "node:assert/strict";
import { test } from "node:test";
import {
  AMBIENT_ACTOR_IDS,
  ambientActorPose,
  barrowActive,
  type AmbientSceneState,
} from "./ambientScene.ts";

const reducedState: AmbientSceneState = {
  reducedMotion: true,
  simulationRunning: true,
  hasHay: true,
};

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

test("ambient actor ids list contains exactly 12 defined actors when S16 rows are approved", () => {
  assert.equal(AMBIENT_ACTOR_IDS.length, 12);
  const expected = new Set([
    "TRACK_RIDER_1",
    "TRACK_RIDER_2",
    "STABLE_GROOM",
    "CLINIC_VET",
    "HOUSE_MANAGER",
    "HOUSE_OWNER",
    "SUPPLY_BARROW",
    "HOUSE_CART",
    "S16_BIRD",
    "S16_CAT",
    "S16_BUTTERFLY",
    "S16_WINDSOCK",
  ]);
  assert.deepEqual(new Set(AMBIENT_ACTOR_IDS), expected);
});

test("rejected or unapproved row ids never appear in AMBIENT_ACTOR_IDS", () => {
  const ids = AMBIENT_ACTOR_IDS as readonly string[];
  assert.ok(!ids.includes("S16_RESERVED_4"));
  assert.ok(!ids.includes("S16_RESERVED_5"));
  assert.ok(!ids.includes("ROW_4"));
  assert.ok(!ids.includes("ROW_5"));
});

test("approved S16 actors are positioned within their designated farm zones", () => {
  const bird = ambientActorPose("S16_BIRD", 0, reducedState);
  assert.ok(bird.x >= 50 && bird.x <= 450, `Bird x ${bird.x} outside paddock zone`);
  assert.ok(bird.y >= 200 && bird.y <= 380, `Bird y ${bird.y} outside paddock fence`);

  const cat = ambientActorPose("S16_CAT", 0, reducedState);
  assert.ok(cat.x >= 600 && cat.x <= 900, `Cat x ${cat.x} outside supply/house path`);
  assert.ok(cat.y >= 500 && cat.y <= 680, `Cat y ${cat.y} outside supply/house path`);

  const butterfly = ambientActorPose("S16_BUTTERFLY", 0, reducedState);
  assert.ok(butterfly.x >= 880 && butterfly.x <= 1180, `Butterfly x ${butterfly.x} outside garden`);
  assert.ok(butterfly.y >= 360 && butterfly.y <= 520, `Butterfly y ${butterfly.y} outside garden`);

  const windsock = ambientActorPose("S16_WINDSOCK", 0, reducedState);
  assert.ok(windsock.x >= 700 && windsock.x <= 1220, `Windsock x ${windsock.x} outside track`);
  assert.ok(windsock.y >= 240 && windsock.y <= 290, `Windsock y ${windsock.y} outside track`);
});
