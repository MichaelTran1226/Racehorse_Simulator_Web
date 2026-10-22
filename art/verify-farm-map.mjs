import { isExactTranslucentComposite } from "./map/source-over.mjs";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { inflateSync } from "node:zlib";
import { assertFarmBuildFresh, readFarmBuildManifest } from "./map/farm-build-manifest.mjs";

function paeth(a, b, c) {
  const p = a + b - c;
  const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
  return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
}

function decode(path) {
  const file = readFileSync(path);
  assert.equal(file.subarray(1, 4).toString(), "PNG", `${path} is not PNG`);
  let offset = 8, width = 0, height = 0, colorType = 0;
  const compressed = [];
  while (offset < file.length) {
    const length = file.readUInt32BE(offset);
    const type = file.subarray(offset + 4, offset + 8).toString();
    const data = file.subarray(offset + 8, offset + 8 + length);
    if (type === "IHDR") {
      width = data.readUInt32BE(0); height = data.readUInt32BE(4);
      assert.equal(data[8], 8, `${path} must use 8-bit channels`);
      colorType = data[9];
    } else if (type === "IDAT") compressed.push(data);
    else if (type === "IEND") break;
    offset += 12 + length;
  }
  assert.ok(colorType === 2 || colorType === 6, `${path} uses unsupported PNG color type ${colorType}`);
  const channels = colorType === 6 ? 4 : 3;
  const packed = inflateSync(Buffer.concat(compressed));
  const stride = width * channels;
  const pixels = Buffer.alloc(stride * height);
  let source = 0;
  for (let y = 0; y < height; y++) {
    const filter = packed[source++];
    for (let x = 0; x < stride; x++) {
      const raw = packed[source++];
      const left = x >= channels ? pixels[y * stride + x - channels] : 0;
      const up = y > 0 ? pixels[(y - 1) * stride + x] : 0;
      const upperLeft = y > 0 && x >= channels ? pixels[(y - 1) * stride + x - channels] : 0;
      const value = filter === 0 ? raw
        : filter === 1 ? raw + left
        : filter === 2 ? raw + up
        : filter === 3 ? raw + Math.floor((left + up) / 2)
        : filter === 4 ? raw + paeth(left, up, upperLeft)
        : assert.fail(`${path} uses invalid PNG filter ${filter}`);
      pixels[y * stride + x] = value & 255;
    }
  }
  return { pixels, channels };
}

function colors(path) {
  const { pixels, channels } = decode(path);
  const result = new Set();
  for (let i = 0; i < pixels.length; i += channels) {
    const alpha = channels === 4 ? pixels[i + 3] : 255;
    if (alpha) result.add(`${pixels[i]}:${pixels[i + 1]}:${pixels[i + 2]}:${alpha}`);
  }
  return result;
}

const sheets = ["sv-spring-outdoors", "sv-flooring", "sv-fence-wood", "sv-fence-iron", "sv-barn", "sv-shed", "sv-silo", "sv-stable", "sv-coop", "sv-well", "sv-houses", "sv-spring-town", "sv-tree1-spring", "sv-tree2-spring", "sv-bushes", "sv-craftables", "sv-mill", "sv-clinic"];
// Compare with Aseprite-normalized copies so color-profile conversion is not mistaken for authored pixels.
const approved = new Set(sheets.flatMap((name) => [...colors(`art/preview/provenance/${name}.png`)]));
const parse = (value) => value.split(":").map(Number);
const translucent = [...approved].map(parse).filter((color) => color[3] > 0 && color[3] < 255);
let opaque = new Set([...approved].filter((value) => value.endsWith(":255")));
for (let depth = 0; depth < 2; depth++) {
  const derived = new Set(opaque);
  for (const [fr, fg, fb, fa] of translucent) {
    for (const background of opaque) {
      const [br, bg, bb] = parse(background);
      const channels = [fr, fg, fb].map((front, index) => {
        const back = [br, bg, bb][index];
        return Math.round((front * fa + back * (255 - fa)) / 255);
      });
      derived.add(`${channels[0]}:${channels[1]}:${channels[2]}:255`);
    }
  }
  opaque = derived;
}
const allowed = new Set([...approved, ...opaque]);
const approvedChannels = [...approved].map(parse);
function isProfileEquivalent(value) {
  const [r, g, b, a] = parse(value);
  return approvedChannels.some(([sr, sg, sb, sa]) => sa === a && Math.max(Math.abs(sr - r), Math.abs(sg - g), Math.abs(sb - b)) <= 16);
}
// Aseprite làm tròn kết quả trộn alpha khác Math.round tối đa 1 đơn vị mỗi kênh.
const derivedChannels = [...opaque].map(parse);
const isRoundingOfDerived = (value) => {
  const [r, g, b, a] = parse(value);
  return a === 255 && derivedChannels.some(([dr, dg, db]) => Math.abs(dr - r) <= 1 && Math.abs(dg - g) <= 1 && Math.abs(db - b) <= 1);
};
const outputs = [
  "art/preview/farm-day-x1.png", "public/assets/maps/farm-ground.png",
  "public/assets/maps/objects/stable.png", "public/assets/maps/objects/barn.png",
  "public/assets/maps/objects/vet.png", "public/assets/maps/objects/track.png",
  "public/assets/maps/objects/groom-house.png",
];
for (const path of outputs) {
  for (const color of colors(path)) assert.ok(allowed.has(color) || isProfileEquivalent(color) || isRoundingOfDerived(color) || isExactTranslucentComposite(parse(color), translucent), `${path} contains RGBA not derivable by source-over copy ${color}`);
}
assertFarmBuildFresh(readFarmBuildManifest());
console.log(`verified ${outputs.length} generated PNGs against ${sheets.length} approved sprite sheets and copy compositing`);
