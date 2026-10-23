// Sinh docs/handoff/ASSET_MANIFEST.json từ file thật (đọc kích thước trong header PNG / .aseprite).
// Chạy lại mỗi khi thêm, đổi hoặc xoá asset: node scripts/gen-asset-manifest.mjs
import assert from "node:assert/strict";
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { basename, extname, join } from "node:path";

/** Kích thước ảnh: PNG (IHDR ở byte 16/20) hoặc .aseprite (WORD rộng/cao ở byte 8/10). */
function size(path) {
  const b = readFileSync(path);
  if (extname(path) === ".aseprite") {
    assert.equal(b.readUInt16LE(4), 0xa5e0, `${path} không phải file Aseprite`);
    return { width: b.readUInt16LE(8), height: b.readUInt16LE(10) };
  }
  assert.equal(b.subarray(1, 4).toString(), "PNG", `${path} không phải PNG`);
  return { width: b.readUInt32BE(16), height: b.readUInt32BE(20) };
}

const files = (dir, ext) => readdirSync(dir).filter((f) => f.endsWith(ext)).sort().map((f) => join(dir, f).replaceAll("\\", "/"));
// Đường dẫn web: file trong public/ được Vite phục vụ ở gốc "/"; file trong art/ chỉ dùng lúc dựng bản đồ.
const webPath = (p) => (p.startsWith("public/") ? p.slice("public".length) : p);
const id = (prefix, p) => `${prefix}.${basename(p, extname(p))}`;

/** [thư mục, đuôi, tiền tố id, layer, tileSize (px, null = ảnh nguyên khối), lọc file] */
const GROUPS = [
  ["public/assets/maps", ".png", "map", "map-ground", 16],
  ["public/assets/maps/objects", ".png", "map-object", "map-object", 16],
  ["public/assets/sprites", ".png", "sprite", "actor-sprite", 32, (p) => !/s0[8]|s10/.test(p)],
  ["public/assets/sprites", ".png", "dev-sprite", "dev-overview-only", 32, (p) => /s0[8]|s10/.test(p)],
  ["public/assets/sprites/sv", ".png", "critter", "critter-sprite", null],
  ["public/assets/clouds", ".png", "cloud", "intro-cloud", null],
  ["art/png/sv", ".png", "sheet", "map-source-sheet", 16, (p) => !p.endsWith("sv-clouds.png")],
  ["art/png/sv", ".png", "sheet", "cloud-source-sheet", null, (p) => p.endsWith("sv-clouds.png")],
  ["art/aseprite", ".aseprite", "aseprite", "aseprite-source", 32],
];
// Khung con vật Stardew: gà, vịt 16 px; chó, mèo và critters_ambient 32 px.
const CRITTER_TILE = { "brown-chicken": 16, "white-chicken": 16, duck: 16, dog: 32, cat: 32, critters: 32 };

const assets = [];
for (const [dir, ext, prefix, layer, tile, keep = () => true] of GROUPS) {
  for (const p of files(dir, ext).filter(keep)) {
    const name = basename(p, ext);
    assets.push({ id: id(prefix, p), filePath: webPath(p), ...size(p), tileSize: prefix === "critter" ? CRITTER_TILE[name] : name === "farm-day" ? 16 : tile, layer });
  }
}

assert.equal(new Set(assets.map((a) => a.id)).size, assets.length, "id trùng");
for (const a of assets) assert.ok(a.width > 0 && a.height > 0, a.id);
assert.ok(assets.some((a) => a.id === "map.farm-ground" && a.width === 1280 && a.height === 768), "thiếu nền bản đồ 1280×768");

mkdirSync("docs/handoff", { recursive: true });
writeFileSync("docs/handoff/ASSET_MANIFEST.json", `${JSON.stringify({
  version: 1,
  project: "Racehorse_Simulator_Web_v3",
  note: "filePath bắt đầu bằng '/assets/' là URL web (Vite phục vụ từ public/); bắt đầu bằng 'art/' là file nguồn chỉ dùng khi dựng bản đồ, không tải ở runtime. Sinh bằng scripts/gen-asset-manifest.mjs.",
  world: { width: 1280, height: 768, tile: 16 },
  assets,
}, null, 2)}\n`);
console.log(`ASSET_MANIFEST.json: ${assets.length} assets`);
