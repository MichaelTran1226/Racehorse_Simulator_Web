import assert from "node:assert/strict";
import { test } from "node:test";
import {
  APPROVED_S16_ROWS,
  generateAmbientLifeSheet,
  S16_PALETTE_HEX,
} from "./ambient-life.ts";
import { existsSync, readFileSync } from "node:fs";
import { FARM_ASSET_URLS } from "../../src/render/farmAssets.ts";

test("generated S16 sheet is 192x192 and contains 6 rows of 6 cols", () => {
  const sheetImg = generateAmbientLifeSheet();
  assert.equal(sheetImg.w, 192);
  assert.equal(sheetImg.h, 192);
});

test("all nontransparent pixels come from the declared SRS-compatible palette", () => {
  const sheetImg = generateAmbientLifeSheet();
  const allowed = new Set(S16_PALETTE_HEX.map((h) => h.toLowerCase()));
  for (let y = 0; y < sheetImg.h; y++) {
    for (let x = 0; x < sheetImg.w; x++) {
      const c = sheetImg.get(x, y);
      if (c[3] === 0) continue;
      const hex = `#${c[0].toString(16).padStart(2, "0")}${c[1].toString(16).padStart(2, "0")}${c[2].toString(16).padStart(2, "0")}`.toLowerCase();
      assert.ok(allowed.has(hex), `Unexpected color ${hex} at (${x}, ${y})`);
    }
  }
});

test("footed animals in row 0 (bird) and row 1 (cat) use baseline y=30", () => {
  const sheetImg = generateAmbientLifeSheet();
  // Row 0 (bird): baseline y is row * 32 + 30 = 30
  let birdHasFoot = false;
  for (let col = 0; col < 6; col++) {
    for (let x = col * 32; x < (col + 1) * 32; x++) {
      if (sheetImg.alpha(x, 30) > 0) birdHasFoot = true;
      assert.equal(sheetImg.alpha(x, 31), 0, `Bird pixel below baseline at (${x}, 31)`);
    }
  }
  assert.ok(birdHasFoot, "Bird must have pixels resting on baseline y=30");

  // Row 1 (cat): baseline y is 1 * 32 + 30 = 62
  let catHasFoot = false;
  for (let col = 0; col < 6; col++) {
    for (let x = col * 32; x < (col + 1) * 32; x++) {
      if (sheetImg.alpha(x, 62) > 0) catHasFoot = true;
      assert.equal(sheetImg.alpha(x, 63), 0, `Cat pixel below baseline at (${x}, 63)`);
    }
  }
  assert.ok(catHasFoot, "Cat must have pixels resting on baseline y=62");
});

test("rows 4 and 5 are transparent and reserved", () => {
  const sheetImg = generateAmbientLifeSheet();
  for (let y = 4 * 32; y < 6 * 32; y++) {
    for (let x = 0; x < 192; x++) {
      assert.equal(sheetImg.alpha(x, y), 0, `Reserved row has pixel at (${x}, ${y})`);
    }
  }
});

test("S16 rút khỏi runtime 20/10/2026: con vật Stardew thay thế", () => {
  assert.deepEqual([...APPROVED_S16_ROWS], ["BIRD", "CAT", "BUTTERFLY", "WINDSOCK"]);
  const urls = JSON.stringify(FARM_ASSET_URLS).toLowerCase();
  assert.equal(urls.includes("s16-ambient-life.png"), false);
  assert.match(urls, /\/assets\/sprites\/sv\/white-chicken\.png/);
  assert.equal(existsSync(new URL("../../public/assets/sprites/s16-ambient-life.png", import.meta.url)), false);
  assert.equal(readFileSync(new URL("../../src/render/sprites.ts", import.meta.url), "utf8").includes("ambientLife"), false);
});

