import assert from "node:assert/strict";
import { test } from "node:test";
import { stableHorseFrame } from "./stableHorses.ts";
import { VISIBLE_STABLE_STALLS } from "../hub/farmPopulation.ts";
import { FARM_ANCHORS } from "../hub/farmLayout.ts";

test("reduced motion fixes every stable horse on idle frame zero", () => {
  for (const time of [0, 1, 10, 100]) assert.equal(stableHorseFrame(time, true, 2), 0);
});

test("stable horse animation uses only approved idle frames", () => {
  for (const time of [0, 0.5, 1, 2]) assert.ok([0, 1, 2].includes(stableHorseFrame(time, false, 1)));
});

test("all visible stall openings use the three unique farm anchors", () => {
  assert.equal(new Set(VISIBLE_STABLE_STALLS.map(({ x, y }) => `${x},${y}`)).size, 3);
  assert.deepEqual(VISIBLE_STABLE_STALLS.map(({ x, y }) => ({ x, y })), FARM_ANCHORS.stableStalls);
});
