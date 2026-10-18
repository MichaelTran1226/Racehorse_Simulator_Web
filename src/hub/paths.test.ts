import assert from "node:assert/strict";
import { test } from "node:test";
import { paddockHorse, paddockHorseAt, PADDOCK_SLOTS, truckPose, TRUCK_STOP_X } from "./paths.ts";

test("tapping a paddock horse finds its slot; empty grass and missing horses find none", () => {
  for (let slot = 0; slot < PADDOCK_SLOTS; slot++) {
    for (const time of [0, 3.3, 8, 12.5, 18]) {
      const h = paddockHorse(slot, time);
      assert.equal(paddockHorseAt({ x: h.x, y: h.y - 10 }, time, PADDOCK_SLOTS), slot);
      assert.equal(paddockHorseAt({ x: h.x, y: h.y - 10 }, time, slot), -1, "slot without a horse is not tappable");
    }
  }
  assert.equal(paddockHorseAt({ x: 5, y: 5 }, 0, PADDOCK_SLOTS), -1);
});

test("delivery truck drives in, parks to unload until arrival, then leaves the map", () => {
  const arrive = 100;
  assert.equal(truckPose(arrive - 9, arrive, 8), null, "not yet dispatched");
  const driving = truckPose(arrive - 4, arrive, 8);
  assert.ok(driving && !driving.open && driving.x < TRUCK_STOP_X);
  assert.deepEqual(truckPose(arrive - 0.5, arrive, 8), { x: TRUCK_STOP_X, y: 604, open: true });
  const leaving = truckPose(arrive + 2, arrive, 8);
  assert.ok(leaving && !leaving.open && leaving.x > TRUCK_STOP_X);
  assert.equal(truckPose(arrive + 5, arrive, 8), null, "gone");
});
