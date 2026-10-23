import assert from "node:assert/strict";
import { test } from "node:test";
import {
  AMBIENT_ACTOR_IDS,
  advanceAmbientClock,
  ambientActorPose,
  barrowActive,
  walkPause,
  doorTrip,
  MANAGER_PATH,
  CHICKEN_PATHS,
  DOG_PATH,
  OWNER_PATH,
  WILD_KINDS,
  WILD_PATHS,
  perchedBirds,
  getFlyingBirds,
  POULTRY_YARD,
  DUCK_PATH,
  getChimneySmokePuffs,
  getActiveSpeechBubbles,
  type AmbientSceneState,
} from "./ambientScene.ts";

import { FARM_ANCHORS, FARM_PLACEMENTS } from "./farmLayout.ts";

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
  assert.equal(AMBIENT_ACTOR_IDS.length, 27);
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
    "SV_CHICKEN_1",
    "SV_CHICKEN_2",
    "SV_CHICKEN_3",
    "SV_DUCK",
    "SV_DOG",
    "SV_CAT",
    "WILD_BLUEBIRD_1",
    "WILD_BLUEBIRD_2",
    "WILD_SPARROW_1",
    "WILD_SPARROW_2",
    "WILD_RABBIT",
    "WILD_SQUIRREL",
  ]);
  assert.deepEqual(new Set(AMBIENT_ACTOR_IDS), expected);
});


test("walkPause đi rồi dừng theo chu kỳ, không lùi quãng đường", () => {
  assert.deepEqual(walkPause(0, 10, 3), { walkedS: 0, paused: false });
  assert.deepEqual(walkPause(11, 10, 3), { walkedS: 10, paused: true });
  assert.deepEqual(walkPause(14, 10, 3), { walkedS: 11, paused: false });
  const far = walkPause(1e6, 10, 3);
  assert.ok(far.walkedS > 0 && Number.isFinite(far.walkedS));
});

test("nài trong sân cát huấn luyện luôn nằm trong khung vòng cưỡi, kể cả thời gian rất lớn", () => {
  for (const t of [0, 7.3, 1e6]) {
    const p = ambientActorPose("LEFT_RIDER", t, runningState);
    assert.ok(p.x >= 1024 && p.x <= 1200 && p.y >= 200 && p.y <= 256, `${t}: ${p.x},${p.y}`);
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
  assert.ok(p.y >= 304 && p.y <= 352, "trên đường xe hàng");
  assert.ok(p.x >= 24 && p.x <= 1256);
});

test("con vật Stardew: không còn S16, đúng sheet và cỡ khung (không có bò)", () => {
  assert.equal(AMBIENT_ACTOR_IDS.some((id) => id.startsWith("S16_")), false);
  for (const id of AMBIENT_ACTOR_IDS.filter((id) => id.startsWith("SV_"))) {
    const p = ambientActorPose(id, 5, runningState);
    assert.ok(p.sheet && ["whiteChicken", "brownChicken", "duck", "dog", "cat"].includes(p.sheet), id);
    assert.equal(p.size, p.sheet === "dog" || p.sheet === "cat" ? 32 : 16, id);
  }
});

test("gà và chó đứng yên tại chỗ khi nghỉ, khi đi dùng hàng phải/trái", () => {
  for (const id of ["SV_CHICKEN_1", "SV_CHICKEN_2", "SV_DOG"] as const) {
    for (let t = 0; t < 12; t += 0.05) {
      const a = ambientActorPose(id, t, runningState);
      const b = ambientActorPose(id, t + 0.01, runningState);
      if (a.row === 0 && b.row === 0) assert.deepEqual({ x: a.x, y: a.y }, { x: b.x, y: b.y }, `${id} trượt ở t=${t}`);
      else if (a.row !== 0) assert.ok(a.row === 1 || a.row === 3, `${id} hàng ${a.row}`);
    }
  }
  assert.equal(ambientActorPose("SV_DOG", 2, { ...runningState, simulationRunning: false }).row, 0);
});

test("con vật vẫn trên đường đi khi time = 1e6", () => {
  const within = (p: { x: number; y: number }, path: readonly { x: number; y: number }[]) =>
    p.x >= Math.min(...path.map((q) => q.x)) && p.x <= Math.max(...path.map((q) => q.x)) &&
    p.y >= Math.min(...path.map((q) => q.y)) && p.y <= Math.max(...path.map((q) => q.y));
  assert.ok(within(ambientActorPose("SV_CHICKEN_1", 1e6, runningState), CHICKEN_PATHS[0]));
  assert.ok(within(ambientActorPose("SV_DOG", 1e6, runningState), DOG_PATH));
});


test("doorTrip ra rồi vào, không lùi quãng đường trong một chu kỳ", () => {
  for (const [time, walkedS, inside] of [[0, 0, false], [8, 8, false], [15.9, 15.9, false], [16, 16, true], [21.9, 16, true], [22, 0, false]] as const) {
    assert.deepEqual(doorTrip(time, 16, 6), { walkedS, inside });
  }
});

test("người ra từ cửa, về tới cửa trước khi ẩn trong nhà", () => {
  for (const [id, phase, outS] of [["HOUSE_MANAGER", 0, 16], ["HOUSE_OWNER", 11, 14]] as const) {
    for (const t of [22 - phase, outS - phase, outS + 1 - phase]) {
      const p = ambientActorPose(id, t, runningState);
      assert.deepEqual({ x: p.x, y: p.y }, FARM_ANCHORS.houseDoor);
      assert.equal(p.active, t === 22 - phase);
    }
    const beforeDoor = ambientActorPose(id, outS - phase - 0.001, runningState);
    assert.ok(Math.hypot(beforeDoor.x - FARM_ANCHORS.houseDoor.x, beforeDoor.y - FARM_ANCHORS.houseDoor.y) < 0.1);
    const reduced = ambientActorPose(id, outS - phase, reducedState);
    assert.equal(reduced.active, true);
    assert.deepEqual({ x: reduced.x, y: reduced.y }, FARM_ANCHORS.houseDoor);
    const running = ambientActorPose(id, 1, runningState);
    const paused = ambientActorPose(id, 1, { ...runningState, simulationRunning: false });
    assert.deepEqual({ x: paused.x, y: paused.y, active: paused.active }, { x: running.x, y: running.y, active: running.active });
    assert.equal(paused.frame, 4);
  }
  const start = ambientActorPose("HOUSE_MANAGER", 0, runningState);
  assert.deepEqual({ x: start.x, y: start.y }, FARM_ANCHORS.houseDoor);
});

test("người ra vào nhà vẫn trên đường đi khi time = 1e6", () => {
  for (const [id, path] of [["HOUSE_MANAGER", MANAGER_PATH], ["HOUSE_OWNER", OWNER_PATH]] as const) {
    const p = ambientActorPose(id, 1e6, runningState);
    assert.ok(p.x >= Math.min(...path.map(p => p.x)) && p.x <= Math.max(...path.map(p => p.x)));
    assert.ok(p.y >= Math.min(...path.map(p => p.y)) && p.y <= Math.max(...path.map(p => p.y)));
  }
});

test("con vật hoang ở vườn phía tây: đúng sheet, ở trên đường đi, quay mặt theo hướng đi", () => {
  for (const id of AMBIENT_ACTOR_IDS.filter((id) => id.startsWith("WILD_"))) {
    const path = WILD_PATHS[id as keyof typeof WILD_PATHS];
    for (const time of [0, 3.7, 1e6]) {
      const p = ambientActorPose(id, time, runningState);
      assert.equal(p.sheet, "wild", id);
      assert.equal(p.size, 32, id);
      assert.ok(p.x >= Math.min(...path.map((q) => q.x)) && p.x <= Math.max(...path.map((q) => q.x)), `${id} x ở t=${time}`);
      assert.ok(p.x < 176, `${id} ở vườn phía tây`);
      const kind = Object.values(WILD_KINDS).find((k) => k.row === p.row)!;
      assert.ok(kind, `${id} hàng ${p.row}`);
      assert.equal(p.flip, p.dir !== kind.faces, `${id} quay mặt theo hướng đi`);
      assert.ok(([...kind.walk, ...kind.idle] as number[]).includes(p.frame), `${id} khung ${p.frame}`);
    }
    assert.deepEqual(ambientActorPose(id, 0, reducedState), ambientActorPose(id, 50, reducedState), `${id} đứng yên khi giảm chuyển động`);
  }
});

test("xe điện chạy ngang trên đường trên cùng, không lên xuống", () => {
  const a = ambientActorPose("HOUSE_CART", 0, runningState);
  const b = ambientActorPose("HOUSE_CART", 7, runningState);
  assert.equal(a.y, b.y);
  assert.ok(a.y >= 80 && a.y <= 112, "trên đường trên cùng (y 80–112)");
});

test("chim đậu đúng trên tán cây đã đặt trong bản đồ, đổi tư thế chậm, đứng im khi giảm chuyển động", () => {
  const trees = FARM_PLACEMENTS.filter((p) => /^sv-tree[12]-spring$/.test(p.sheet) || (p.sheet === "sv-spring-outdoors" && p.src.x === 160 && p.src.y === 0 && p.src.h === 96));
  assert.ok(FARM_ANCHORS.perches.length >= 6);
  for (const p of FARM_ANCHORS.perches) {
    assert.ok(trees.some((t) => p.x >= t.dest.x && p.x <= t.dest.x + t.src.w && p.y >= t.dest.y && p.y <= t.dest.y + t.src.h * 0.6), `(${p.x},${p.y}) nằm trên tán một cây`);
  }
  const birds = perchedBirds(5, runningState);
  assert.equal(birds.length, FARM_ANCHORS.perches.length);
  for (const b of birds) {
    const kind = Object.values(WILD_KINDS).find((k) => k.row === b.row)!;
    assert.ok((kind.idle as readonly number[]).includes(b.frame));
    assert.equal(b.sheet, "wild");
  }
  assert.deepEqual(perchedBirds(0, reducedState), perchedBirds(77, reducedState));
  assert.ok(new Set(birds.map((b) => b.row)).size >= 3, "có sẻ, chim xanh và quạ");
});

test("gà và vịt sống trong vườn rào phía tây trên", () => {
  const inYard = (q: { x: number; y: number }) => q.x >= POULTRY_YARD.x && q.x <= POULTRY_YARD.x + POULTRY_YARD.w && q.y >= POULTRY_YARD.y && q.y <= POULTRY_YARD.y + POULTRY_YARD.h;
  for (const path of [...CHICKEN_PATHS, DUCK_PATH]) assert.ok(path.every(inYard));
  for (const id of ["SV_CHICKEN_1", "SV_CHICKEN_2", "SV_CHICKEN_3", "SV_DUCK"] as const) {
    for (const time of [0, 4.2, 1e6]) assert.ok(inYard(ambientActorPose(id, time, runningState)), id);
  }
});

test("khói ống khói bốc lên bồng bềnh từ nhà Groom và đứng yên khi giảm chuyển động", () => {
  const normal = getChimneySmokePuffs(5, false);
  assert.equal(normal.length, 5);
  for (const p of normal) {
    assert.ok(p.x >= 950 && p.x <= 975);
    assert.ok(p.y <= 148 && p.y >= 110);
    assert.ok(p.alpha >= 0 && p.alpha <= 0.7);
  }
  const reduced = getChimneySmokePuffs(5, true);
  assert.equal(reduced.length, 1);
  assert.equal(reduced[0].x, 955);
});

test("bong bóng thoại NPC hiển thị theo chu kỳ, đúng người và không bị rỗng", () => {
  const b1 = getActiveSpeechBubbles(2);
  assert.ok(b1.some((b) => b.actorId === "CHAT_A" && b.text.length > 0));
  const b2 = getActiveSpeechBubbles(7);
  assert.ok(b2.some((b) => b.actorId === "CHAT_B" && b.text.length > 0));
  for (let t = 0; t < 60; t += 3) {
    const list = getActiveSpeechBubbles(t);
    for (const b of list) {
      assert.ok(b.text.length > 0);
      assert.ok(AMBIENT_ACTOR_IDS.includes(b.actorId));
    }
  }
});

test("chim bay lượn vồng giữa các tán cây theo đường parabol và biến mất khi giảm chuyển động", () => {
  const birdsFlying = getFlyingBirds(2, runningState);
  assert.ok(birdsFlying.length > 0, "phải có ít nhất một chim đang bay ở t=2s");
  for (const b of birdsFlying) {
    assert.equal(b.sheet, "wild");
    assert.equal(b.size, 32);
    assert.ok(b.frame >= 0 && b.frame <= 3, "khung vỗ cánh là cột 0..3");
    assert.ok(b.x >= 0 && b.x <= 1280);
    assert.ok(b.y >= 0 && b.y <= 768);
  }
  const reducedBirds = getFlyingBirds(2, reducedState);
  assert.equal(reducedBirds.length, 0, "không có chim bay khi bật reducedMotion");
});


