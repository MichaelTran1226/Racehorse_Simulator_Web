import assert from "node:assert/strict";
import { test } from "node:test";
import { seedHorses } from "../sim/horses.ts";
import { FARM_ANCHORS } from "./farmLayout.ts";
import {
  assignPaddockHorses,
  assignStableHorses,
  VISIBLE_STABLE_STALLS,
} from "./farmPopulation.ts";

test("locking one paddock horse preserves the unaffected horse's slot", () => {
  const before = assignPaddockHorses(seedHorses());
  const locked = seedHorses().map((horse) => (horse.id === "HRS-001" ? { ...horse, medicalLock: true } : horse));
  const after = assignPaddockHorses(locked);
  assert.equal(before[1]?.id, "HRS-002");
  assert.equal(after[1]?.id, "HRS-002");
  assert.notEqual(after[0]?.id, "HRS-001");
});

test("a horse uses the visible stable anchor derived from its stall and is never duplicated", () => {
  const horses = seedHorses();
  const paddock = assignPaddockHorses(horses);
  const stable = assignStableHorses(horses, new Set(paddock.flatMap((horse) => (horse ? [horse.id] : []))));
  assert.equal(new Set(stable.map(({ horse }) => horse.id)).size, stable.length);
  assert.ok(stable.every(({ horse }) => !paddock.some((candidate) => candidate?.id === horse.id)));
});

test("chỗ đứng chuồng nhìn thấy là 3 vị trí lấy từ anchors", () => {
  assert.equal(VISIBLE_STABLE_STALLS.length, 3);
  assert.deepEqual(VISIBLE_STABLE_STALLS.map(({ x, y }) => ({ x, y })), FARM_ANCHORS.stableStalls);
  assert.ok(Object.isFrozen(VISIBLE_STABLE_STALLS));
  for (const [index, anchor] of VISIBLE_STABLE_STALLS.entries()) {
    assert.ok(Object.isFrozen(anchor));
    assert.equal(anchor.index, index);
    assert.equal(anchor.cellX, Math.floor(anchor.x / 16));
    assert.equal(anchor.cellY, Math.floor(anchor.y / 16));
  }
});

test("chỉ 3 ngựa đầu (theo ô chuồng) hiện ở chuồng và không trùng", () => {
  const horses = seedHorses().slice(0, 6).map((horse, index) => ({
    ...horse, health: "FIT" as const, medicalLock: false, stall: { col: index, row: 0 },
  }));
  const stable = assignStableHorses(horses, new Set());
  assert.deepEqual(stable.map(({ anchor }) => anchor.index), [0, 1, 2]);
  assert.deepEqual(stable.map(({ horse }) => horse.id), horses.slice(0, 3).map(({ id }) => id));
  assert.equal(new Set(stable.map(({ horse }) => horse.id)).size, 3);
});

test("3 chỗ đứng chuồng lấp bằng ngựa không ra bãi thả, theo thứ tự ô chuồng", () => {
  const horses = seedHorses();
  const paddock = assignPaddockHorses(horses);
  const stable = assignStableHorses(horses, new Set(paddock.flatMap((horse) => (horse ? [horse.id] : []))));
  assert.deepEqual(stable.map(({ anchor }) => anchor.index), [0, 1, 2]);
  assert.deepEqual(stable.map(({ horse }) => horse.id), ["HRS-003", "HRS-004", "HRS-005"]);
});
