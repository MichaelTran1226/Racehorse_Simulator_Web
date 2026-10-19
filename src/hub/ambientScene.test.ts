import assert from "node:assert/strict";
import { test } from "node:test";
import {
  AMBIENT_ACTOR_IDS,
  advanceAmbientClock,
  ambientActorPose,
  barrowActive,
  walkPause,
  type AmbientSceneState,
} from "./ambientScene.ts";

const runningState: AmbientSceneState = { reducedMotion: false, simulationRunning: true, hasHay: true };

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

test("loaded barrow stays visible while paused and disappears only without hay or in reduced motion", () => {
  assert.equal(barrowActive({ reducedMotion: false, simulationRunning: true, hasHay: true }), true);
  assert.equal(barrowActive({ reducedMotion: false, simulationRunning: false, hasHay: true }), true);
  assert.equal(barrowActive({ reducedMotion: false, simulationRunning: true, hasHay: false }), false);
  assert.equal(barrowActive({ reducedMotion: true, simulationRunning: true, hasHay: true }), false);
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

test("pausing keeps the loaded barrow visible at the same coordinates", () => {
  const running = ambientActorPose("SUPPLY_BARROW", 4, {
    reducedMotion: false,
    simulationRunning: true,
    hasHay: true,
  });
  const paused = ambientActorPose("SUPPLY_BARROW", 4, {
    reducedMotion: false,
    simulationRunning: false,
    hasHay: true,
  });
  assert.equal(running.active, true);
  assert.equal(paused.active, true);
  assert.deepEqual({ x: paused.x, y: paused.y }, { x: running.x, y: running.y });
});

test("reduced motion returns a stable pose for every ambient actor", () => {
  for (const id of AMBIENT_ACTOR_IDS) {
    assert.deepEqual(ambientActorPose(id, 0, reducedState), ambientActorPose(id, 99, reducedState));
  }
});

test("ambient actor ids contain only approved existing actors", () => {
  assert.equal(AMBIENT_ACTOR_IDS.length, 15);
  const expected = new Set([
    "TRACK_RIDER_1",
    "TRACK_RIDER_2",
    "STABLE_GROOM",
    "CLINIC_VET",
    "HOUSE_MANAGER",
    "HOUSE_OWNER",
    "SUPPLY_BARROW",
    "HOUSE_CART",
    "LEFT_RIDER",
    "LEFT_COACH",
    "ROAD_CART",
    "SUPPLY_HAYCART",
    "BARN_GROOMING",
    "CHAT_A",
    "CHAT_B",
  ]);
  assert.deepEqual(new Set(AMBIENT_ACTOR_IDS), expected);
});

test("unapproved S16 row ids never appear in AMBIENT_ACTOR_IDS", () => {
  const ids = AMBIENT_ACTOR_IDS as readonly string[];
  for (const id of ["S16_BIRD", "S16_CAT", "S16_BUTTERFLY", "S16_WINDSOCK"]) {
    assert.equal(ids.includes(id), false);
  }
});

test("walkPause đi rồi dừng theo chu kỳ, không lùi quãng đường", () => {
  assert.deepEqual(walkPause(0, 10, 3), { walkedS: 0, paused: false });
  assert.deepEqual(walkPause(11, 10, 3), { walkedS: 10, paused: true });
  assert.deepEqual(walkPause(14, 10, 3), { walkedS: 11, paused: false });
  const far = walkPause(1e6, 10, 3);
  assert.ok(far.walkedS > 0 && Number.isFinite(far.walkedS));
});

test("nài trên ô đất trái luôn nằm trong khung vòng cưỡi, kể cả thời gian rất lớn", () => {
  for (const t of [0, 7.3, 1e6]) {
    const p = ambientActorPose("LEFT_RIDER", t, runningState);
    assert.ok(p.x >= 32 && p.x <= 200 && p.y >= 316 && p.y <= 372, `${t}: ${p.x},${p.y}`);
  }
});

test("HLV giơ đồng hồ khi đang chạy, đứng yên khi tạm dừng", () => {
  assert.equal(ambientActorPose("LEFT_COACH", 7, runningState).frame, 5);
  assert.equal(ambientActorPose("LEFT_COACH", 7, { ...runningState, simulationRunning: false }).frame, 4);
});

test("bác sĩ đứng yên đúng chỗ khi khom khám", () => {
  const a = ambientActorPose("CLINIC_VET", 10.5, runningState);
  const b = ambientActorPose("CLINIC_VET", 12.5, runningState);
  assert.equal(a.frame, 5);
  assert.deepEqual({ x: a.x, y: a.y }, { x: b.x, y: b.y });
  assert.equal(ambientActorPose("CLINIC_VET", 10.5, { ...runningState, simulationRunning: false }).frame, 4);
});

test("xe kéo cỏ ẩn khi kho hết cỏ", () => {
  assert.equal(ambientActorPose("SUPPLY_HAYCART", 3, runningState).active, true);
  assert.equal(ambientActorPose("SUPPLY_HAYCART", 3, { ...runningState, hasHay: false }).active, false);
});

test("hai người trò chuyện quay mặt vào nhau và không cùng làm động tác", () => {
  const a = ambientActorPose("CHAT_A", 3.5, runningState);
  const b = ambientActorPose("CHAT_B", 3.5, runningState);
  assert.notEqual(a.flip, b.flip);
  assert.ok(!(a.frame === 5 && b.frame === 5));
});

test("xe điện chạy trên đường chính", () => {
  const p = ambientActorPose("ROAD_CART", 1e6, runningState);
  assert.equal(p.y, 596);
  assert.ok(p.x >= 40 && p.x <= 1240);
});
