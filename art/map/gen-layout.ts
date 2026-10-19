// Sinh art/map/farm-layout.json — bố cục trang trại dày kiểu M1 (40×24 ô = 1280×768 px, hiển thị ×2 ≈ 2–3 màn hình).
// Chỉ đặt ô cắt nguyên từ các sheet đã duyệt (S07/S08/S10/S15); Aseprite (build-farm-map.lua) ghép thành PNG.
// Chạy: node art/map/gen-layout.ts && aseprite -b --script art/aseprite/build-farm-map.lua
import { writeFileSync } from "node:fs";

const T = 32;
const W = 40;
const H = 24;

type Sheet = "s07-stall" | "s08-farm" | "s10-arena" | "s15-vehicles";
type Layer = "ground" | "paths" | "fences" | "buildings" | "decor" | "markers";
interface Src {
  sheet: Sheet;
  c: number;
  r: number;
  w?: number;
  h?: number;
}
interface Placement {
  sheet: Sheet;
  src: { x: number; y: number; w: number; h: number };
  dest: { x: number; y: number };
  layer: Layer;
  z: number;
  repeat?: { cols: number; rows: number };
}

const tile = (sheet: Sheet, c: number, r: number, w = 1, h = 1): Src => ({ sheet, c, r, w, h });
const S08 = (c: number, r: number) => tile("s08-farm", c, r);
const S07 = (c: number, r: number) => tile("s07-stall", c, r);
const S10 = (c: number, r: number) => tile("s10-arena", c, r);

const GRASS = S08(0, 0);
const GRASS_DENSE = S08(1, 0);
const FLOWERS = S08(2, 0);
const ROAD = S08(4, 0);
const CROSS = S08(0, 1);
const FENCE = S08(1, 1);
const FENCE_V = S08(2, 1);
const GATE_CLOSED = S08(4, 1);
const GATE_OPEN = S08(5, 1);
const CANOPY = S08(0, 2);
const TRUNK = S08(1, 2);
const BUSH = S08(2, 2);
const FLOWER_BUSH = S08(3, 2);
const POND_CORNER = S08(4, 2);
const POND_EDGE = S08(5, 2);
const HAY_STACK = S08(0, 3);
const SACKS = S08(1, 3);
const ROOF_GRAY = S08(2, 3);
const BARN_DOOR = S08(3, 3);
const ROOF_RED = S08(4, 3);
const OFFICE_WINDOW = S08(5, 3);
const ROOF_BLUE = S08(0, 4);
const CLINIC_CROSS = S08(1, 4);
const CLINIC_DOOR = S08(2, 4);
const SMALL_WINDOW = S08(3, 4);
const CROSS_SIGN = S08(4, 4);
const STRAW_PILE = S08(5, 4);
const STUMP = S08(0, 5);
const ROCKS = S08(4, 5);
const WELL = S08(5, 5);
const WEEDS = S08(3, 5);

const fills: object[] = [];
const placements: Placement[] = [];
const objects: { id: string; name: string; target: string; z: number; focus: { x: number; y: number }; bounds: { x: number; y: number; w: number; h: number }; placements: Placement[] }[] = [];

function place(list: Placement[], s: Src, x: number, y: number, layer: Layer, z: number, cols = 1, rows = 1) {
  const w = (s.w ?? 1) * T;
  const h = (s.h ?? 1) * T;
  list.push({
    sheet: s.sheet,
    src: { x: s.c * T, y: s.r * T, w, h },
    dest: { x: x * T, y: y * T },
    layer,
    z,
    ...(cols > 1 || rows > 1 ? { repeat: { cols, rows } } : {}),
  });
}
const decor = (s: Src, x: number, y: number, z = 40, cols = 1, rows = 1) => place(placements, s, x, y, "decor", z, cols, rows);
const tree = (x: number, y: number) => {
  decor(CANOPY, x, y, 70);
  decor(TRUNK, x, y + 1, 69);
};

/** Công trình bấm được: các ô của nó vào lớp buildings + PNG riêng (để viền ôm và kiểm tra trúng pixel). */
function building(id: string, name: string, target: string, z: number, draw: (put: (s: Src, x: number, y: number, cols?: number, rows?: number) => void) => void) {
  const list: Placement[] = [];
  draw((s, x, y, cols = 1, rows = 1) => place(list, s, x, y, "buildings", z, cols, rows));
  const xs = list.flatMap((p) => [p.dest.x, p.dest.x + p.src.w * (p.repeat?.cols ?? 1)]);
  const ys = list.flatMap((p) => [p.dest.y, p.dest.y + p.src.h * (p.repeat?.rows ?? 1)]);
  const bounds = { x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) };
  objects.push({ id, name, target, z, focus: { x: bounds.x + bounds.w / 2, y: bounds.y + bounds.h / 2 }, bounds, placements: list });
}

// ---- Nền: cỏ phủ kín, rải cỏ dày & hoa dại theo mẫu cố định
fills.push({ id: "grass", sheet: "s08-farm", src: { x: 0, y: 0, w: T, h: T }, area: { x: 0, y: 0, w: W * T, h: H * T }, step: { x: T, y: T }, layer: "ground", z: 0 });
for (let y = 0; y < H; y++)
  for (let x = 0; x < W; x++) {
    const n = (x * 7 + y * 13) % 17;
    if (n === 0) place(placements, FLOWERS, x, y, "ground", 1);
    else if (n === 5 || n === 11) place(placements, GRASS_DENSE, x, y, "ground", 1);
  }

// ===== Bố cục theo ảnh M1 (vị trí tương đối các khu); ô vuông nhìn thẳng nên đường chéo của M1 thành đường gấp khúc.
const SAND_LIGHT = S07(3, 1); // cát nhạt (mặt sân / lối đi trong chuồng)
const SAND = S07(4, 1); // cát vàng (làn cát)
const DIRT = S08(1, 5); // vệt bánh xe — làn đất

// ---- Đường đất uốn qua trang trại (như M1): dọc trước dãy chuồng → vòng quanh bãi thả → xuống cổng và sang nhà kho
place(placements, ROAD, 0, 8, "paths", 10, 8, 1); // trước dãy chuồng
for (let y = 9; y < 18; y++) place(placements, CROSS, 7, y, "paths", 11); // xuống phía vườn hoa
place(placements, CROSS, 7, 8, "paths", 11);
place(placements, ROAD, 0, 18, "paths", 10, 40, 1); // trục dưới: cổng → nhà kho → phòng khám
place(placements, CROSS, 7, 18, "paths", 11);
for (let y = 10; y < 18; y++) place(placements, CROSS, 26, y, "paths", 11); // từ đường đua xuống
place(placements, CROSS, 26, 18, "paths", 11);
place(placements, ROAD, 26, 10, "paths", 10, 14, 1); // nhánh tới nhà cam
place(placements, CROSS, 26, 10, "paths", 11);

// ---- Dãy chuồng (trên-trái, 2 dãy như M1): mái tôn + hàng cửa ô chuồng có ngựa/rơm
building("stable", "Khu chuồng", "STALL", 60, (put) => {
  const doors = [S07(0, 1), S07(2, 1), S07(1, 1), S07(2, 1), S07(0, 1), S07(2, 1)];
  put(S07(5, 5), 0, 0, 9, 1); // dãy 1
  for (let i = 0; i < 9; i++) put(doors[i % doors.length], i, 1);
  put(S07(5, 5), 1, 3, 11, 1); // dãy 2 lệch phải như M1
  for (let i = 0; i < 11; i++) put(doors[(i + 2) % doors.length], 1 + i, 4);
});
place(placements, SAND_LIGHT, 0, 2, "paths", 12, 9, 1); // lối đi rơm trước dãy 1
place(placements, SAND_LIGHT, 1, 5, "paths", 12, 11, 1); // lối đi trước dãy 2
decor(S07(4, 2), 12, 1, 41); // máng nước đầu dãy 1
decor(S07(4, 3), 12, 0, 41);
decor(S07(0, 2), 12, 2, 41); // máng ăn bên hông dãy chuồng
decor(S07(4, 2), 12, 3, 41); // máng nước bên hông dãy chuồng
decor(WEEDS, 14, 5, 41);
decor(S07(5, 3), 12, 4, 41);
decor(S07(2, 2), 12, 5, 41);
tree(13, 1);
tree(0, 10);

// ---- Bãi thả có rào ở giữa (ao bên trái, kiện rơm bên phải, cây to ở mép trên)
place(placements, FENCE, 9, 7, "fences", 30, 15, 1);
place(placements, FENCE, 9, 15, "fences", 30, 7, 1);
place(placements, GATE_OPEN, 16, 15, "fences", 30);
place(placements, FENCE, 17, 15, "fences", 30, 7, 1);
place(placements, FENCE_V, 8, 8, "fences", 30, 1, 7);
place(placements, FENCE_V, 24, 8, "fences", 30, 1, 7);
decor(POND_CORNER, 9, 10, 20);
decor(POND_EDGE, 10, 10, 20, 2, 1);
decor(ROCKS, 9, 12, 42);
decor(HAY_STACK, 20, 9, 42);
decor(S07(4, 3), 22, 10, 42); // kiện rơm
decor(S07(4, 3), 19, 12, 42);
decor(HAY_STACK, 12, 13, 42);
decor(S07(4, 2), 23, 9, 41); // máng nước mép bãi thả
decor(ROCKS, 23, 14, 42);
decor(WEEDS, 10, 14, 42);
tree(16, 5);

// ---- Đường đua vòng (trên-phải): rào ngoài, làn nhiều mặt sân ở cạnh dưới (cỏ · cát · đất như M1), sân trong cỏ
building("track", "Đường đua", "TRACK", 58, (put) => {
  put(FENCE, 18, 0, 22, 1); // rào ngoài trên
  put(SAND_LIGHT, 18, 1, 22, 2); // làn trên
  put(SAND_LIGHT, 18, 3, 2, 3); // khúc cua trái
  put(FENCE, 20, 3, 18, 1); // rào trong trên
  put(FENCE, 20, 5, 18, 1); // rào trong dưới
  put(SAND_LIGHT, 38, 3, 2, 3); // khúc cua phải
  put(SAND_LIGHT, 18, 6, 6, 2); // làn dưới: cát nhạt
  put(SAND, 24, 6, 7, 2); // làn cát vàng
  put(DIRT, 31, 6, 7, 2); // làn đất
  put(SAND_LIGHT, 38, 6, 2, 2);
  put(FENCE, 18, 8, 22, 1); // rào ngoài dưới
  put(S10(0, 0), 20, 6, 1, 2); // cổng xuất phát
  put(S10(3, 0), 37, 6, 1, 2); // vạch đích
  put(S10(2, 4), 23, 4); // cột cảm biến trong sân
  put(S10(2, 4), 29, 4);
  put(S10(2, 4), 35, 4);
  put(S10(4, 0), 26, 4); // cột mốc cự ly
});
tree(17, 9);
tree(39, 9);
decor(FLOWER_BUSH, 25, 9, 42);
decor(BUSH, 38, 9, 42);

// ---- Nhà cam (nhà ở, chỉ trang trí — Văn phòng CLB đã bỏ khỏi giao diện người dùng)
place(placements, ROOF_RED, 29, 11, "decor", 50, 6, 2);
place(placements, OFFICE_WINDOW, 29, 13, "decor", 50, 2, 1);
place(placements, CLINIC_DOOR, 31, 13, "decor", 50);
place(placements, OFFICE_WINDOW, 32, 13, "decor", 50, 3, 1);
tree(36, 11);
decor(FLOWER_BUSH, 35, 13, 42);
decor(FLOWER_BUSH, 28, 14, 42);
decor(BUSH, 36, 14, 42);

// ---- Kho vật tư (nhà kho xám, giữa-dưới) + bao cám, kiện rơm, xe kéo cỏ trước cửa
building("barn", "Kho vật tư", "SUPPLY", 60, (put) => {
  put(ROOF_GRAY, 19, 19, 6, 2);
  put(S07(1, 0), 19, 21, 2, 1);
  put(BARN_DOOR, 21, 21);
  put(BARN_DOOR, 22, 21);
  put(S07(1, 0), 23, 21, 2, 1);
});
decor(SACKS, 18, 21, 51);
decor(HAY_STACK, 18, 20, 51);
decor(SACKS, 17, 20, 51);
decor(HAY_STACK, 25, 20, 51);
decor({ sheet: "s15-vehicles", c: 0, r: 4, w: 2, h: 1 }, 26, 21, 55); // xe kéo cỏ

// ---- Phòng khám thú y (góc dưới-phải)
building("vet", "Phòng khám thú y", "VET", 60, (put) => {
  put(ROOF_BLUE, 33, 19, 6, 2);
  put(SMALL_WINDOW, 33, 21);
  put(CLINIC_CROSS, 34, 21);
  put(CLINIC_DOOR, 35, 21);
  put(CLINIC_CROSS, 36, 21);
  put(SMALL_WINDOW, 37, 21, 2, 1);
});
decor(CROSS_SIGN, 32, 21, 51);
tree(39, 19);
decor(FLOWER_BUSH, 32, 22, 42);
decor(ROCKS, 38, 22, 42);

// ---- Vườn hoa có rào (giữa-trái)
place(placements, FENCE, 0, 12, "fences", 30, 5, 1);
place(placements, GATE_CLOSED, 5, 12, "fences", 30);
decor(FLOWER_BUSH, 0, 13, 42, 3, 1);
decor(BUSH, 3, 13, 42);
decor(FLOWER_BUSH, 4, 13, 42, 2, 1);
decor(FLOWER_BUSH, 1, 15, 42, 2, 1);
decor(BUSH, 3, 15, 42);
decor(FLOWER_BUSH, 4, 15, 42);
decor(WELL, 5, 16, 42);

// ---- Cổng trang trại + xe tải chở ngựa (dưới-trái), vườn phía dưới giữa
place(placements, FENCE, 0, 22, "fences", 30, 6, 1);
place(placements, GATE_OPEN, 6, 22, "fences", 30);
place(placements, FENCE, 7, 22, "fences", 30, 4, 1);
place(placements, FENCE, 9, 20, "fences", 30, 8, 1);
decor(FLOWER_BUSH, 10, 21, 42, 3, 1);
decor(BUSH, 13, 21, 42);
decor(FLOWER_BUSH, 14, 21, 42, 2, 1);
decor(STUMP, 16, 21, 42);
decor({ sheet: "s15-vehicles", c: 2, r: 5, w: 2, h: 1 }, 11, 16, 55); // xe điện đỗ bên đường
tree(0, 22);
tree(27, 22);
tree(30, 22);
decor(BUSH, 37, 23, 42);
decor(ROCKS, 28, 16, 42);
decor(WEEDS, 31, 16, 42);
decor(STRAW_PILE, 25, 13, 42);

const layout = { version: 3, world: { width: W * T, height: H * T, tile: T }, fills, placements, objects };
writeFileSync(new URL("./farm-layout.json", import.meta.url), JSON.stringify(layout, null, 1));
console.log(`farm-layout.json: ${placements.length} placements, ${objects.length} objects, world ${W * T}×${H * T}`);
