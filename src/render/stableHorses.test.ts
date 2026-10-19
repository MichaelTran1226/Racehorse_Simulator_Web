import assert from "node:assert/strict";
import { test } from "node:test";
import { stableHorseFrame } from "./stableHorses.ts";
import { VISIBLE_STABLE_STALLS } from "../hub/farmPopulation.ts";

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
