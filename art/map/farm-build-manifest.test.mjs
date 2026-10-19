import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import {
  FARM_BUILD_INPUTS,
  assertFarmBuildFresh,
  readFarmBuildManifest,
} from "./farm-build-manifest.mjs";

test("farm build manifest binds the current layout and every rendered PNG", () => {
  assert.doesNotThrow(() => assertFarmBuildFresh(readFarmBuildManifest()));
});

test("farm build manifest rejects a stale ground PNG even when sidecar files are unchanged", () => {
  const manifest = readFarmBuildManifest();
  const realRead = (path) => readFileSync(path);
  const staleRead = (path) => path === "public/assets/maps/farm-ground.png"
    ? Buffer.from("stale map bytes")
    : realRead(path);
  assert.throws(
    () => assertFarmBuildFresh(manifest, staleRead),
    /farm-ground\.png is stale/,
  );
  assert.ok(FARM_BUILD_INPUTS.includes("art/map/farm-layout.json"));
});
