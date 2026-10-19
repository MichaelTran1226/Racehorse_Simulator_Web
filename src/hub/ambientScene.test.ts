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

test("ambient actor ids contain only approved existing actors", () => {
  assert.equal(AMBIENT_ACTOR_IDS.length, 8);
  const expected = new Set([
    "TRACK_RIDER_1",
    "TRACK_RIDER_2",
    "STABLE_GROOM",
    "CLINIC_VET",
    "HOUSE_MANAGER",
    "HOUSE_OWNER",
    "SUPPLY_BARROW",
    "HOUSE_CART",
  ]);
  assert.deepEqual(new Set(AMBIENT_ACTOR_IDS), expected);
});

test("unapproved S16 row ids never appear in AMBIENT_ACTOR_IDS", () => {
  const ids = AMBIENT_ACTOR_IDS as readonly string[];
  for (const id of ["S16_BIRD", "S16_CAT", "S16_BUTTERFLY", "S16_WINDSOCK"]) {
    assert.equal(ids.includes(id), false);
  }
});
