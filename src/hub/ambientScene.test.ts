import assert from "node:assert/strict";
import { test } from "node:test";
import {
  AMBIENT_ACTOR_IDS,
  advanceAmbientClock,
  ambientActorPose,
  barrowActive,
  type AmbientSceneState,
} from "./ambientScene.ts";

const reducedState: AmbientSceneState = {
  reducedMotion: true,
  simulationRunning: true,
  hasHay: true,
};

test("ambient clock freezes while paused and resumes without counting paused time", () => {
  const running = advanceAmbientClock({ time: 4, lastNow: 10 }, 11, true);
  assert.deepEqual(running, { time: 5, lastNow: 11 });

  const paused = advanceAmbientClock(running, 20, false);
  assert.deepEqual(paused, { time: 5, lastNow: 20 });

  const resumed = advanceAmbientClock(paused, 21, true);
  assert.deepEqual(resumed, { time: 6, lastNow: 21 });
});

test("loaded barrow moves only while simulation runs and hay remains", () => {
  assert.equal(barrowActive({ reducedMotion: false, simulationRunning: true, hasHay: true }), true);
  assert.equal(barrowActive({ reducedMotion: false, simulationRunning: false, hasHay: true }), false);
  assert.equal(barrowActive({ reducedMotion: false, simulationRunning: true, hasHay: false }), false);
});

test("pausing keeps actors at the pose for the supplied simulation time", () => {
  const running = ambientActorPose("TRACK_RIDER_1", 4, {
    reducedMotion: false,
    simulationRunning: true,
    hasHay: true,
  });
  const paused = ambientActorPose("TRACK_RIDER_1", 4, {
    reducedMotion: false,
    simulationRunning: false,
    hasHay: true,
  });
  assert.deepEqual({ x: paused.x, y: paused.y, dir: paused.dir }, { x: running.x, y: running.y, dir: running.dir });
  assert.equal(paused.frame, 0);
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
