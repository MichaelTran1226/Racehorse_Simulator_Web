import assert from "node:assert/strict";
import { test } from "node:test";
import { seedHorses } from "../sim/horses.ts";
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

test("visible stable anchors are 7 immutable positions matching open stall openings", () => {
  assert.equal(VISIBLE_STABLE_STALLS.length, 7);
  assert.equal(new Set(VISIBLE_STABLE_STALLS.map(({ x, y }) => `${x},${y}`)).size, 7);
  assert.ok(VISIBLE_STABLE_STALLS.every(({ x, y }) => x >= 0 && x < 384 && y >= 32 && y < 160));
});
