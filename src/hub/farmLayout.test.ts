import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import {
  ALLOWED_MAP_SHEETS,
  FARM_OBJECTS,
  FARM_ANCHORS,
  FARM_PLACEMENTS,
  FARM_WORLD,
  RESERVED_CORRIDORS,
  SHEET_SIZES,
  validateDecorCorridors,
  validateFarmLayout,
} from "./farmLayout.ts";

test("farm layout is a 1280 by 768 sprite-only world (≈2–3 screens at 2×)", () => {
  assert.deepEqual(FARM_WORLD, { width: 1280, height: 768, tile: 16 });
  assert.ok(FARM_PLACEMENTS.length > 80 * 48, "ground repeat must expand to a complete world");
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
  assert.match(script, /art\/png\/sv\//);
  assert.match(script, /Image\(source, Rectangle\(/);
});

test("loose decor placements do not overlap reserved corridors or building bounds", () => {
  assert.equal(validateDecorCorridors(), true);
  assert.ok(RESERVED_CORRIDORS.length >= 5);
  const objectIds = new Set(FARM_OBJECTS.map((o) => o.id));
  assert.deepEqual(objectIds, new Set(["stable", "track", "barn", "vet"]));
  for (const placement of FARM_PLACEMENTS) {
    assert.ok(ALLOWED_MAP_SHEETS.has(placement.sheet));
  }
});


test("bản đồ chỉ dùng sheet Stardew", () => {
  assert.equal(FARM_PLACEMENTS.some((p) => /^s[01]/.test(p.sheet)), false);
});

test("mọi sheet bản đồ là PNG Stardew (chép nguyên byte, trừ sv-clinic vá đối xứng), đúng kích thước khai báo", () => {
  assert.equal(Object.keys(SHEET_SIZES).length, 18);
  for (const [key, size] of Object.entries(SHEET_SIZES)) {
    const png = readFileSync(new URL(`../../art/png/sv/${key}.png`, import.meta.url));
    assert.deepEqual(png.subarray(0, 8), Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), key);
    assert.deepEqual({ w: png.readUInt32BE(16), h: png.readUInt32BE(20) }, size, key);
  }
  assert.equal(SHEET_SIZES["sv-barn"].w, 112);
  assert.deepEqual(ALLOWED_MAP_SHEETS, new Set(Object.keys(SHEET_SIZES)));
  assert.ok([...ALLOWED_MAP_SHEETS].every((s) => s.startsWith("sv-")));
});

const contains = (rect: { x: number; y: number; w: number; h: number }, point: { x: number; y: number }) =>
  point.x >= rect.x && point.x <= rect.x + rect.w && point.y >= rect.y && point.y <= rect.y + rect.h;

test("anchors nằm trong công trình và thế giới", () => {
  const object = (id: string) => FARM_OBJECTS.find((o) => o.id === id)!;
  assert.equal(FARM_ANCHORS.stableStalls.length, 3);
  for (const point of FARM_ANCHORS.stableStalls.slice(0, 2)) assert.ok(contains(object("stable").bounds, point));
  assert.ok(contains({ x: 0, y: 0, w: FARM_WORLD.width, h: FARM_WORLD.height }, FARM_ANCHORS.stableStalls[2]));
  assert.ok(contains(object("barn").bounds, FARM_ANCHORS.supplyDoor));
  assert.ok(contains(object("vet").bounds, FARM_ANCHORS.clinicDoor));
  assert.ok(object("track").placements.some((p) => /^sv-tree[12]-spring$/.test(p.sheet)));
});

test("crop validation accepts each sheet edge and rejects one pixel overflow", () => {
  const placement = FARM_PLACEMENTS[0];
  const original = { sheet: placement.sheet, src: placement.src };
  try {
    for (const [sheet, size] of Object.entries(SHEET_SIZES)) {
      placement.sheet = sheet;
      placement.src = { x: size.w - 1, y: size.h - 1, w: 1, h: 1 };
      assert.equal(validateFarmLayout(), true, sheet);
      placement.src = { ...placement.src, w: 2 };
      assert.throws(() => validateFarmLayout(), /Source rect outside sheet/, sheet);
      placement.src = { x: size.w - 1, y: size.h - 1, w: 1, h: 2 };
      assert.throws(() => validateFarmLayout(), /Source rect outside sheet/, sheet);
    }
  } finally {
    Object.assign(placement, original);
  }
});

test("decor moved onto the truck road or a building is rejected", () => {
  assert.equal(validateDecorCorridors(), true);
  const placement = FARM_PLACEMENTS.find((p) => p.layer === "decor" && p.sheet === "sv-spring-town" && p.src.y === 448)!; // một cây đèn
  const original = placement.dest;
  try {
    placement.dest = { x: 400, y: 310 };
    assert.throws(() => validateDecorCorridors(), /overlaps reserved corridor/);
    placement.dest = { x: 700, y: 200 };
    assert.throws(() => validateDecorCorridors(), /overlaps building vet/);
  } finally {
    placement.dest = original;
  }
});

test("đường xe hàng chạy thẳng qua cửa kho, xuyên từ mép trái sang mép phải", () => {
  const road = RESERVED_CORRIDORS[0];
  assert.deepEqual({ x: road.x, w: road.w, h: road.h }, { x: 0, w: FARM_WORLD.width, h: 48 }, "3 ô × 16 px, đủ chiều ngang");
  const barn = FARM_OBJECTS.find((o) => o.id === "barn")!;
  assert.ok(FARM_ANCHORS.supplyDoor.x > barn.bounds.x && FARM_ANCHORS.supplyDoor.x < barn.bounds.x + barn.bounds.w);
  assert.ok(road.y - (barn.bounds.y + barn.bounds.h) <= 16, "cửa kho nhìn thẳng ra đường");
});
