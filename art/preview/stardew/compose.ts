// Ghép bản xem trước bố cục bản đồ từ asset Stardew (kích thước gốc, ô 16 px) + ngựa/người hiện có. args: A|B out.png
import { savePng, Img } from "file:///E:/01_Academic_FPT/Courses/Se_5_Active/SWP391/MINH_Racehorse_Branch/Racehorse_Simulator_Web/art/gen/pixel.ts";
import { loadPng, crop } from "./png.ts";
const SV = "../sv/Stardrew Valley/", PRJ = "E:/01_Academic_FPT/Courses/Se_5_Active/SWP391/MINH_Racehorse_Branch/Racehorse_Simulator_Web/public/assets/sprites/";
const SEASON = process.argv[4] ?? "summer";
const W = 80, H = 48, T = 16, out = new Img(W * T, H * T);
let seed = 7;
const rnd = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;

const summer = loadPng(SV + "03_Tilesets_and_Terrain/" + SEASON + "_outdoorsTileSheet.png");
const floor = loadPng(SV + "03_Tilesets_and_Terrain/Flooring.png");
const fence1 = loadPng(SV + "Full_Raw_Assets/LooseSprites/Fence1.png");
const fence3 = loadPng(SV + "Full_Raw_Assets/LooseSprites/Fence3.png");
const houses = loadPng(SV + "02_Stables_and_Buildings/houses.png");
const B = (f: string) => loadPng(SV + "02_Stables_and_Buildings/" + f);
const barn = crop(B("Barn.png"), 0, 0, 96, 128), coop = noWhite(crop(B("Coop.png"), 0, 0, 96, 128)), shed = B("Shed.png"), stable = B("Stable.png");
const silo = B("Silo.png"), well = B("Well.png"), mill = crop(B("Mill.png"), 0, 0, 64, 128);
const office = crop(houses, 0, 288, 160, 144), clinic = crop(loadPng(SV + "03_Tilesets_and_Terrain/spring_town.png"), 0, 176, 80, 128);
for (let y = 0; y < 32; y++) for (let x = 0; x < 16; x++) clinic.set(x, y, [0, 0, 0, 0]); // xóa bia đá dính sẵn trong ô của sheet thị trấn
const trees = [`tree1_${SEASON}.png`, `tree2_${SEASON}.png`].map((f) => crop(loadPng(SV + "03_Tilesets_and_Terrain/" + f), 0, 0, 48, 96));
const bushSh = loadPng(SV + "03_Tilesets_and_Terrain/bushes.png");
const bushes = [crop(bushSh, 0, 98, 31, 29), crop(bushSh, 32, 98, 31, 29), crop(bushSh, 1, 132, 47, 43)];
const A_ = SV + "05_Animals_and_Ambient_Life/";
const chicken = crop(loadPng(A_ + "White Chicken.png"), 0, 0, 16, 16), chickenB = crop(loadPng(A_ + "Brown Chicken.png"), 16, 16, 16, 16);
const duck = crop(loadPng(A_ + "Duck.png"), 0, 16, 16, 16), dog = crop(loadPng(A_ + "dog.png"), 0, 32, 32, 32), cat = crop(loadPng(A_ + "cat.png"), 0, 224, 32, 32);
const horse = loadPng(PRJ + "s01-horse.png"), people = loadPng(PRJ + "s06-people.png"), rider = loadPng(PRJ + "s14-rider.png");
function noWhite(i: Img) { for (let y = 0; y < i.h; y++) for (let x = 0; x < i.w; x++) { const c = i.get(x, y); if (c[0] > 250 && c[1] > 250 && c[2] > 250) i.set(x, y, [0, 0, 0, 0]); } return i; }
const craft = loadPng(SV + "03_Tilesets_and_Terrain/Craftables.png");
const barrel = crop(craft, 96, 448, 16, 32), crate = crop(craft, 32, 448, 16, 32), chest = crop(craft, 32, 512, 16, 32);
const cell = (sh: Img, c: number, r: number) => crop(sh, c * 32, r * 32, 32, 32);

// --- Nền cỏ
for (let y = 0; y < H; y++)
  for (let x = 0; x < W; x++) {
    const r = rnd(), t = r < 0.03 ? [0, 6] : r < 0.05 ? [1, 6] : r < 0.25 ? [0, 11] : [0, 7];
    out.blit(crop(summer, t[0] * T, t[1] * T, T, T), x * T, y * T);
  }
// --- Đất (autotile 4×4 của Flooring tại ô (4,4))
const dirt: boolean[][] = Array.from({ length: H }, () => Array(W).fill(false));
const fillRect = (x0: number, y0: number, x1: number, y1: number, v = true) => {
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (y >= 0 && x >= 0 && y < H && x < W) dirt[y][x] = v;
};
const ring = (x0: number, y0: number, x1: number, y1: number, w: number) => {
  fillRect(x0, y0, x1, y1);
  fillRect(x0 + w, y0 + w, x1 - w, y1 - w, false);
  for (const [cx, cy, sx, sy] of [[x0, y0, 1, 1], [x1, y0, -1, 1], [x0, y1, 1, -1], [x1, y1, -1, -1]])
    for (let k = 0; k < 3; k++) for (let j = 0; j < 3 - k; j++) dirt[cy + sy * k][cx + sx * j] = false;
};
const drawDirt = () => {
  const d = (x: number, y: number) => y >= 0 && x >= 0 && y < H && x < W && dirt[y][x];
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++)
      if (dirt[y][x]) {
        const n = d(x, y - 1), s = d(x, y + 1), e = d(x + 1, y), w = d(x - 1, y);
        let c: number, r: number;
        if (!e && !w) { c = 0; r = n && s ? 2 : s ? 1 : n ? 3 : 0; }
        else if (!n && !s) { r = 3; c = e && w ? 2 : e ? 1 : 3; }
        else { c = !w ? 1 : !e ? 3 : 2; r = !n ? 0 : !s ? 2 : 1; }
        out.blit(crop(floor, (4 + c) * T, (4 + r) * T, T, T), x * T, y * T);
      }
};
// --- Vật thể sắp theo chân
type Obj = { img: Img; x: number; y: number; foot: number };
const objs: Obj[] = [];
const put = (img: Img, px: number, footY: number) => objs.push({ img, x: px, y: footY - img.h, foot: footY });
const fenceH = (sh: Img, x0: number, x1: number, ty: number) => {
  for (let x = x0; x <= x1; x++) put(crop(sh, (x === x0 ? 0 : x === x1 ? 2 : 1) * T, 2 * 32, T, 32), x * T, ty * T + T);
};
const fenceV = (sh: Img, tx: number, y0: number, y1: number) => {
  for (let y = y0; y <= y1; y++) put(crop(sh, 0, 32, T, 32), tx * T, y * T + T);
};
const pen = (sh: Img, x0: number, y0: number, x1: number, y1: number, gate = -1, top = false) => {
  if (top && gate >= 0) { fenceH(sh, x0, gate - 1, y0); fenceH(sh, gate + 2, x1, y0); fenceH(sh, x0, x1, y1); fenceV(sh, x0, y0 + 1, y1 - 1); fenceV(sh, x1, y0 + 1, y1 - 1); return; }
  fenceH(sh, x0, x1, y0);
  if (gate < 0) fenceH(sh, x0, x1, y1);
  else { fenceH(sh, x0, gate - 1, y1); fenceH(sh, gate + 2, x1, y1); }
  fenceV(sh, x0, y0 + 1, y1 - 1);
  fenceV(sh, x1, y0 + 1, y1 - 1);
};
const tree = (tx: number, ty: number) => put(trees[rnd() < 0.5 ? 0 : 1], tx * T - 16, ty * T + T);
const bush = (tx: number, ty: number, i = Math.floor(rnd() * 3)) => put(bushes[i], tx * T, ty * T + T);
const bld = (img: Img, tx: number, ty: number) => put(img, tx * T, ty * T + img.h);
const horseAt = (px: number, py: number, row: number, f = 0) => put(cell(horse, f, row), px, py + 2);
const person = (px: number, py: number, row: number) => put(cell(people, 4, row), px, py + 2);

if (process.argv[2] === "A") {
  // Cụm công trình phía bắc, đường đất ngang, đường đua lớn phía nam có bãi thả ở giữa, sân tập bên trái.
  fillRect(1, 13, 78, 14);
  for (const x of [9, 22, 36, 47, 62]) fillRect(x, 10, x + 1, 12);
  fillRect(10, 15, 11, 19);
  ring(22, 18, 78, 46, 3);
  fillRect(3, 20, 17, 33);
  drawDirt();
  bld(office, 4, 1); bld(clinic, 17, 1);
  bld(barn, 30, 2); bld(barn, 41, 2); bld(stable, 50, 4); bld(silo, 55, 1);
  bld(coop, 58, 2); bld(shed, 65, 1); put(well, 74 * T, 11 * T);
  pen(fence1, 2, 19, 18, 34, 10, true);
  pen(fence3, 25, 21, 75, 43);
  pen(fence1, 32, 26, 68, 38, 49);
  for (const [x, y] of [[1, 37], [4, 40], [8, 44], [13, 41], [17, 45], [2, 46], [20, 38], [76, 4], [78, 9], [28, 9], [0, 4]]) tree(x, y);
  for (const [x, y] of [[19, 36], [6, 37], [11, 46], [26, 10], [54, 12], [72, 12], [15, 16]]) bush(x, y);
  horseAt(40 * T, 19 * T, 3, 1); horseAt(60 * T, 45 * T, 3, 3); horseAt(76 * T, 30 * T, 3, 2);
  for (const [x, y, f] of [[38, 30, 0], [45, 33, 1], [56, 29, 2], [63, 35, 0]]) horseAt(x * T, y * T, f === 1 ? 4 : 0, f);
  put(cell(rider, 0, 1), 9 * T, 27 * T + 2); person(14 * T, 31 * T, 1);
  person(21 * T, 12 * T, 2); person(33 * T, 12 * T, 3); person(8 * T, 12 * T, 0);
  for (const [x, y] of [[58, 16], [60, 17], [62, 15], [57, 18]]) put(rnd() < 0.5 ? chicken : chickenB, x * T, y * T + T);
  put(duck, 70 * T, 16 * T); put(dog, 12 * T, 16 * T); put(cat, 26 * T, 13 * T);
} else {
  // Đồng bằng mở: đường đua dài nằm ngang phía nam, chuồng + bãi thả ở giữa, nhà điều hành/phòng khám bên phải, sân tập bên trái.
  ring(2, 28, 77, 46, 3);
  fillRect(1, 14, 78, 15);
  fillRect(39, 16, 40, 27);
  fillRect(4, 3, 18, 12);
  for (const x of [27, 35, 48, 58, 71]) fillRect(x, 10, x + 1, 13);
  drawDirt();
  bld(barn, 22, 1); bld(barn, 31, 1); bld(silo, 42, 0); bld(shed, 45, 1);
  bld(office, 54, 1); bld(clinic, 69, 1);
  for (const [img, x] of [[barrel, 44], [barrel, 45], [crate, 51], [chest, 52]] as const) put(img, x * T, 10 * T + T);
  bld(coop, 22, 17); bld(stable, 73, 18); put(well, 76 * T, 12 * T);
  pen(fence1, 3, 2, 19, 13, 10);
  pen(fence1, 43, 18, 70, 26, 55);
  pen(fence3, 5, 31, 74, 43);
  for (const [x, y] of [[1, 18], [3, 23], [7, 20], [12, 25], [16, 19], [79, 25], [76, 21], [20, 9], [0, 0]]) tree(x, y);
  for (const [x, y] of [[10, 17], [18, 23], [74, 26], [64, 12], [30, 24], [52, 24], [15, 36], [33, 38], [52, 35], [66, 39]]) bush(x, y);
  for (const [x, y] of [[24, 37], [44, 40], [60, 36]]) tree(x, y);
  horseAt(30 * T, 29 * T, 3, 1); horseAt(55 * T, 45 * T, 3, 3); horseAt(3 * T, 38 * T, 3, 2);
  for (const [x, y, f] of [[47, 21, 0], [53, 23, 1], [60, 20, 2], [66, 24, 0]]) horseAt(x * T, y * T, f === 1 ? 4 : 0, f);
  put(cell(rider, 0, 1), 9 * T, 7 * T + 2); person(14 * T, 10 * T, 1);
  person(60 * T, 12 * T, 2); person(28 * T, 12 * T, 3); person(56 * T, 12 * T, 0);
  for (const [x, y] of [[26, 26], [28, 27], [30, 25], [25, 27]]) put(rnd() < 0.5 ? chicken : chickenB, x * T, y * T + T);
  put(duck, 34 * T, 26 * T); put(dog, 42 * T, 16 * T); put(cat, 70 * T, 12 * T);
}
objs.sort((a, b) => a.foot - b.foot).forEach((o) => out.blit(o.img, o.x, o.y));
savePng(process.argv[3], out);
