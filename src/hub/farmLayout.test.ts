import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import {
  ALLOWED_MAP_SHEETS,
  FARM_OBJECTS,
  FARM_PLACEMENTS,
  FARM_WORLD,
  validateFarmLayout,
} from "./farmLayout.ts";

test("farm layout is a 1280 by 768 sprite-only world (≈2–3 screens at 2×)", () => {
  assert.deepEqual(FARM_WORLD, { width: 1280, height: 768, tile: 32 });
  assert.ok(FARM_PLACEMENTS.length > 40 * 24, "ground repeat must expand to a complete world");
  assert.equal(validateFarmLayout(), true);

  for (const placement of FARM_PLACEMENTS) {
    assert.ok(ALLOWED_MAP_SHEETS.has(placement.sheet));
    assert.ok(placement.src.x >= 0 && placement.src.y >= 0);
    assert.ok(placement.src.w > 0 && placement.src.h > 0);
    assert.ok(placement.dest.x >= 0 && placement.dest.y >= 0);
    assert.ok(placement.dest.x + placement.src.w <= FARM_WORLD.width);
    assert.ok(placement.dest.y + placement.src.h <= FARM_WORLD.height);
  }
});

test("interactive farm objects have unique ids, valid targets and focus points", () => {
  const validTargets = new Set(["STALL", "TRACK", "VET", "SUPPLY"]);
  assert.equal(new Set(FARM_OBJECTS.map((object) => object.id)).size, FARM_OBJECTS.length);
  assert.deepEqual(
    new Set(FARM_OBJECTS.map((object) => object.target)),
    validTargets,
    "the map must expose every destination",
  );

  for (const object of FARM_OBJECTS) {
    assert.ok(validTargets.has(object.target));
    assert.ok(object.focus.x >= 0 && object.focus.x <= FARM_WORLD.width);
    assert.ok(object.focus.y >= 0 && object.focus.y <= FARM_WORLD.height);
    assert.ok(Number.isInteger(object.z));
    assert.ok(object.placements.length > 0);
  }
});

test("layout contract contains no day-night mode", () => {
  const serialized = JSON.stringify({ FARM_WORLD, FARM_OBJECTS, FARM_PLACEMENTS }).toLowerCase();
  assert.equal(serialized.includes("night"), false);
  assert.equal(serialized.includes("timeofday"), false);
});

test("Aseprite map builder only copies from the approved sheet allowlist", () => {
  const script = readFileSync(new URL("../../art/aseprite/build-farm-map.lua", import.meta.url), "utf8");
  for (const sheet of ALLOWED_MAP_SHEETS) assert.match(script, new RegExp(sheet));
  for (const forbidden of ["drawPixel", "drawLine", "drawRect", "fill", "resize", "rotate", "text"]) {
    assert.equal(new RegExp(`\\b${forbidden}\\b`, "i").test(script), false, `${forbidden} is forbidden`);
  }
  assert.match(script, /Image\(source, Rectangle\(/);
});
