import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

export const FARM_BUILD_INPUTS = [
  "art/map/farm-layout.json",
  "art/aseprite/farm-day.aseprite",
  "art/preview/farm-day-x1.png",
  "public/assets/maps/farm-ground.png",
  "public/assets/maps/objects/stable.png",
  "public/assets/maps/objects/barn.png",
  "public/assets/maps/objects/vet.png",
  "public/assets/maps/objects/track.png",
];

const MANIFEST_PATH = "art/map/farm-build-manifest.json";
const sha256 = (value) => createHash("sha256").update(value).digest("hex");

export function createFarmBuildManifest(read = readFileSync) {
  return {
    version: 1,
    files: Object.fromEntries(FARM_BUILD_INPUTS.map((path) => [path, sha256(read(path))])),
  };
}

export function readFarmBuildManifest(read = readFileSync) {
  return JSON.parse(read(MANIFEST_PATH, "utf8"));
}

export function assertFarmBuildFresh(manifest, read = readFileSync) {
  assert.equal(manifest.version, 1, "unsupported farm build manifest version");
  for (const path of FARM_BUILD_INPUTS) {
    assert.equal(sha256(read(path)), manifest.files[path], `${path} is stale; rebuild and stamp the farm map`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  writeFileSync(MANIFEST_PATH, `${JSON.stringify(createFarmBuildManifest(), null, 2)}\n`);
  console.log(`stamped ${FARM_BUILD_INPUTS.length} farm build inputs and outputs`);
}
