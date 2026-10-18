import assert from "node:assert/strict";
import { test } from "node:test";
import { FARM_ASSET_URLS } from "./farmAssets.ts";
import { drawFarmScene, SQUASH_MS, squashScale, type FarmSceneAssets } from "./farmScene.ts";

test("farm runtime asset list contains only generated maps and approved sprite PNGs", () => {
  const urls = JSON.stringify(FARM_ASSET_URLS).toLowerCase();
  for (const forbidden of ["/assets/concept/", "night", "i22.jpg", "i23.jpg"]) {
    assert.equal(urls.includes(forbidden), false);
  }
  assert.match(urls, /farm-ground\.png/);
  assert.match(urls, /s01-horse\.png/);
});

test("farm scene draws ground, z-sorted objects, then actors", () => {
  const calls: string[] = [];
  const ctx = {
    drawImage(image: { id: string }) { calls.push(image.id); },
  } as unknown as CanvasRenderingContext2D;
  const assets = {
    ground: { id: "ground" },
    objects: new Map([
      ["stable", { id: "stable" }],
      ["vet", { id: "vet" }],
      ["track", { id: "track" }],
    ]),
  } as unknown as FarmSceneAssets;

  drawFarmScene(ctx, assets, 0, () => calls.push("actors"));
  assert.deepEqual(calls, ["ground", "track", "stable", "vet", "actors"]);
});

test("tap squash starts and ends at rest and flattens in between", () => {
  assert.deepEqual(squashScale(0), { sx: 1, sy: 1 });
  const end = squashScale(SQUASH_MS);
  assert.ok(Math.abs(end.sx - 1) < 1e-9 && Math.abs(end.sy - 1) < 1e-9);
  assert.ok(squashScale(SQUASH_MS / 4).sy < 1, "flattens first");
});
