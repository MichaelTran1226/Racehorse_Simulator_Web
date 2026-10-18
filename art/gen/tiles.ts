// Đợt 2 — vẽ lại S07 (chuồng), S08 (trang trại), S10 (thi đấu): mỗi tấm 6×6 ô 32×32, góc nhìn 3/4 từ trên xuống.
// Ô nền (cỏ, đất, rơm) ghép liền không lộ mối nối; mái/tường nhà lặp được theo chiều ngang để dựng nhà rộng tùy ý.
// Chạy: node art/gen/tiles.ts  → art/png/s07|s08|s10-*.png + preview + bản đồ ghép thử.
import assert from "node:assert/strict";
import { copyFileSync } from "node:fs";
import { hex, Img, inEllipse, outline, preview, rotate90, savePng, sheet, type RGBA } from "./pixel.ts";

// ------------------------------------------------------------------ Bảng màu chung (≤ 48 màu, sáng từ trên-trái)

const C = {
  ink: hex("#1D130E"),
  woodDark: hex("#4E2F1A"),
  wood: hex("#7A4E2D"),
  woodLight: hex("#9C6A3F"),
  woodHi: hex("#B9844F"),
  straw: hex("#D9B44A"),
  strawDark: hex("#B8902F"),
  strawLight: hex("#EBCF73"),
  grass: hex("#4E9A3A"),
  grassDark: hex("#3B7D2C"),
  grassLight: hex("#6CB64E"),
  grassHi: hex("#8CCF6A"),
  dirt: hex("#A8784A"),
  dirtDark: hex("#87593A"),
  dirtLight: hex("#C49866"),
  water: hex("#3F8FCF"),
  waterDark: hex("#2C6DA6"),
  waterLight: hex("#8CC8F0"),
  stone: hex("#8A8F93"),
  stoneDark: hex("#5E6367"),
  stoneLight: hex("#B4B9BC"),
  roofRed: hex("#B03A2E"),
  roofRedDark: hex("#8A2A20"),
  roofRedLight: hex("#D0584A"),
  roofGray: hex("#5B6168"),
  roofGrayDark: hex("#42474D"),
  roofGrayLight: hex("#7A8189"),
  roofBlue: hex("#2F6DB5"),
  roofBlueDark: hex("#24528A"),
  roofBlueLight: hex("#4B8BD4"),
  wallWhite: hex("#ECE6D6"),
  wallShade: hex("#CFC6B0"),
  glass: hex("#9FD3EA"),
  glassDark: hex("#5FA7C9"),
  iron: hex("#6E7378"),
  ironDark: hex("#4A4E52"),
  red: hex("#D93838"),
  redDark: hex("#A12626"),
  white: hex("#FFFFFF"),
  gold: hex("#E9C21A"),
  goldDark: hex("#B8901A"),
  goldLight: hex("#F7E07A"),
  silver: hex("#C9CED3"),
  silverDark: hex("#8E959C"),
  bronze: hex("#C27A3A"),
  bronzeDark: hex("#8A5222"),
  leaf: hex("#2F7A34"),
  leafDark: hex("#225C27"),
  leafLight: hex("#45994A"),
  flowerRed: hex("#E04848"),
  flowerYellow: hex("#F2C641"),
  flowerPink: hex("#F08CC0"),
  flowerBlue: hex("#6FA8F0"),
  skin: hex("#E8B48A"),
  dark: hex("#2A2A2E"),
  green: hex("#2E9D4A"),
  blue: hex("#1976D2"),
  purple: hex("#7B3FB0"),
  orange: hex("#EF7C1A"),
  lampGlow: hex("#FFE9A0"),
  shadow: hex("#000000", 60),
  // SRS §12-C: viền ô chuồng dành riêng (code đổi theo 4 trạng thái sức khỏe)
  rule: hex("#00E5FF"),
  fit: hex("#2ECC71"),
  watch: hex("#F1C40F"),
  injured: hex("#E74C3C"),
  isolated: hex("#9B59B6"),
};

// ------------------------------------------------------------------ Dụng cụ vẽ

type Draw = (g: Img) => void;

const hash = (x: number, y: number, s = 0) => {
  let h = Math.imul(x * 374761393 + y * 668265263 + s * 2246822519, 3266489917);
  h ^= h >>> 15;
  return ((h >>> 0) % 1000) / 1000;
};

function R(g: Img, x: number, y: number, w: number, h: number, c: RGBA) {
  for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) g.set(i, j, c);
}
const P = (g: Img, x: number, y: number, c: RGBA) => g.set(x, y, c);

function E(g: Img, cx: number, cy: number, rx: number, ry: number, c: RGBA) {
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++)
    for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) if (inEllipse([x + 0.5, y + 0.5], [cx, cy], rx, ry)) g.set(x, y, c);
}

/** Rắc hạt màu ngẫu nhiên (xác định) — chỉ lên điểm đã có màu `on` nếu cho. */
function speckle(g: Img, x: number, y: number, w: number, h: number, c: RGBA, density: number, seed: number, on?: RGBA) {
  for (let j = y; j < y + h; j++)
    for (let i = x; i < x + w; i++) {
      if (hash(i, j, seed) >= density) continue;
      if (on && g.get(i, j).join() !== on.join()) continue;
      g.set(i, j, c);
    }
}

/** Ô nền cỏ — ghép liền (hạt rắc theo tọa độ trong ô nên mọi ô giống nhau, cạnh khớp). */
function grassBase(g: Img, seed = 1, dense = 0.12) {
  R(g, 0, 0, 32, 32, C.grass);
  speckle(g, 0, 0, 32, 32, C.grassDark, dense, seed);
  speckle(g, 0, 0, 32, 32, C.grassLight, dense * 0.8, seed + 7);
}

function dirtFill(g: Img, test: (x: number, y: number) => boolean, seed = 3) {
  for (let y = 0; y < 32; y++)
    for (let x = 0; x < 32; x++) {
      if (!test(x, y)) continue;
      const n = hash(x, y, seed);
      g.set(x, y, n < 0.08 ? C.dirtDark : n > 0.93 ? C.dirtLight : C.dirt);
    }
  // mép cỏ lởm chởm 1 px quanh vùng đất
  for (let y = 0; y < 32; y++)
    for (let x = 0; x < 32; x++) {
      if (test(x, y)) continue;
      const near = test(x + 1, y) || test(x - 1, y) || test(x, y + 1) || test(x, y - 1);
      if (near && hash(x, y, seed + 5) < 0.6) g.set(x, y, C.grassDark);
    }
}

function strawBase(g: Img, seed: number, thick: boolean) {
  R(g, 0, 0, 32, 32, thick ? C.straw : C.dirtLight);
  for (let i = 0; i < (thick ? 70 : 34); i++) {
    const x = Math.floor(hash(i, 1, seed) * 32);
    const y = Math.floor(hash(i, 2, seed) * 32);
    const len = 2 + Math.floor(hash(i, 3, seed) * 3);
    const c = hash(i, 4, seed) < 0.5 ? C.strawDark : C.strawLight;
    for (let k = 0; k < len; k++) g.set((x + k) % 32, (y + (hash(i, 5, seed) < 0.5 ? 0 : k)) % 32, c);
  }
  if (!thick) speckle(g, 0, 0, 32, 32, C.straw, 0.25, seed + 3);
}

/** Ván gỗ (tường/cửa): ván dọc rộng `pw`, rãnh tối giữa các ván, đầu đinh. */
function planks(g: Img, x: number, y: number, w: number, h: number, pw: number, vertical = true) {
  R(g, x, y, w, h, C.wood);
  if (vertical) {
    for (let i = x; i < x + w; i += pw) {
      R(g, i, y, 1, h, C.woodDark);
      R(g, i + 1, y, 1, h, C.woodLight);
    }
  } else {
    for (let j = y; j < y + h; j += pw) {
      R(g, x, j, w, 1, C.woodDark);
      R(g, x, j + 1, w, 1, C.woodLight);
    }
  }
  speckle(g, x, y, w, h, C.woodDark, 0.04, x * 7 + y);
}

function obj(draw: Draw): Draw {
  return (g) => {
    draw(g);
    outline(g, C.ink, (c) => c[3] < 255);
  };
}

/** Bóng đổ bầu dục dưới vật thể (vẽ trước). */
const shade = (g: Img, cx: number, cy: number, rx: number, ry = 2) => E(g, cx, cy, rx, ry, C.shadow);

function make(rows: Draw[][]): Img {
  return sheet(
    rows.map((row) =>
      row.map((d) => {
        const g = new Img(32, 32);
        d(g);
        return g;
      }),
    ),
  );
}

// ------------------------------------------------------------------ Mảnh dùng chung

function roofTile(g: Img, base: RGBA, dark: RGBA, light: RGBA, kind: "shingle" | "tile" | "metal") {
  // mái dốc nhìn 3/4: nóc ở trên (y 2), mép mái hắt bóng ở dưới (y 29–31); lặp ngang liền
  R(g, 0, 2, 32, 27, base);
  R(g, 0, 2, 32, 2, light); // nóc
  R(g, 0, 1, 32, 1, C.ink);
  for (let y = 7; y < 29; y += kind === "metal" ? 32 : 5) {
    R(g, 0, y, 32, 1, dark);
    if (kind === "shingle") for (let x = (y / 5) % 2 ? 0 : 4; x < 32; x += 8) R(g, x, y - 4, 1, 4, dark);
    if (kind === "tile") for (let x = 0; x < 32; x += 4) P(g, x + ((y / 5) % 2 ? 2 : 0), y - 1, light);
  }
  if (kind === "metal") for (let x = 1; x < 32; x += 4) R(g, x, 4, 1, 25, dark);
  R(g, 0, 29, 32, 2, dark); // mép mái
  R(g, 0, 31, 32, 1, C.ink);
}

function wallTile(g: Img, color: RGBA, shadeC: RGBA) {
  R(g, 0, 0, 32, 30, color);
  R(g, 0, 0, 32, 3, shadeC); // bóng mái hắt xuống tường
  R(g, 0, 28, 32, 2, shadeC);
  R(g, 0, 30, 32, 2, C.stoneDark); // chân tường
}

function windowAt(g: Img, x: number, y: number, w: number, h: number, panes: number) {
  R(g, x - 1, y - 1, w + 2, h + 2, C.woodDark);
  R(g, x, y, w, h, C.glass);
  R(g, x, y, w, 2, C.glassDark);
  for (let i = 1; i < panes; i++) R(g, x + Math.round((w * i) / panes), y, 1, h, C.woodDark);
  P(g, x + 1, y + 3, C.white);
  P(g, x + 2, y + 2, C.white);
  R(g, x - 1, y + h + 1, w + 2, 1, C.woodLight); // bậu cửa
}

function crossSign(g: Img, cx: number, cy: number, s: number, color: RGBA, bg: RGBA) {
  R(g, cx - s - 1, cy - s - 1, s * 2 + 3, s * 2 + 3, bg);
  R(g, cx - 1, cy - s, 3, s * 2 + 1, color);
  R(g, cx - s, cy - 1, s * 2 + 1, 3, color);
}

function trough(g: Img, fill: RGBA | null, fillDark: RGBA, full: boolean) {
  shade(g, 16, 27, 13);
  R(g, 3, 14, 26, 12, C.woodDark);
  R(g, 4, 15, 24, 10, C.wood);
  R(g, 5, 16, 22, 5, fill ? (full ? fill : C.woodDark) : C.woodDark);
  if (fill && full) speckle(g, 5, 15, 22, 6, fillDark, 0.3, 11);
  if (fill && !full) speckle(g, 5, 19, 22, 2, fill, 0.35, 12);
  R(g, 4, 22, 24, 1, C.woodLight);
  R(g, 5, 25, 2, 3, C.woodDark);
  R(g, 25, 25, 2, 3, C.woodDark);
}

function bale(g: Img, x: number, y: number, w: number, h: number) {
  R(g, x, y, w, h, C.straw);
  R(g, x, y, w, 2, C.strawLight);
  R(g, x, y + h - 2, w, 2, C.strawDark);
  speckle(g, x, y + 2, w, h - 4, C.strawDark, 0.18, x + y);
  R(g, x + Math.floor(w / 3), y, 1, h, C.woodDark); // dây buộc
  R(g, x + Math.floor((2 * w) / 3), y, 1, h, C.woodDark);
}

function sack(g: Img, x: number, y: number) {
  E(g, x + 6, y + 9, 6, 7, C.dirtLight);
  E(g, x + 5, y + 8, 4, 5, hex("#D9B98A"));
  R(g, x + 4, y + 1, 5, 3, C.dirtDark); // miệng bao buộc
  R(g, x + 4, y + 9, 4, 1, C.dirtDark);
}

function post(g: Img, x: number, top: number, bottom: number) {
  R(g, x, top, 3, bottom - top, C.wood);
  R(g, x, top, 1, bottom - top, C.woodLight);
  R(g, x, top, 3, 1, C.woodHi);
}

function stripePole(g: Img, x: number, top: number, bottom: number, a: RGBA, b: RGBA) {
  for (let y = top; y < bottom; y++) R(g, x, y, 3, 1, Math.floor((y - top) / 3) % 2 ? b : a);
}

// ------------------------------------------------------------------ S07 — Chuồng

const S07: Draw[][] = [
  [
    (g) => planks(g, 0, 0, 32, 32, 6, false), // tường gỗ ngang
    (g) => planks(g, 0, 0, 32, 32, 6, true), // tường gỗ dọc
    obj((g) => {
      // vách ngăn lưới sắt: nửa dưới ván, nửa trên song sắt
      planks(g, 2, 16, 28, 14, 5, false);
      R(g, 2, 3, 28, 2, C.ironDark);
      for (let x = 3; x < 30; x += 4) R(g, x, 4, 1, 12, C.iron);
      R(g, 2, 15, 28, 1, C.ironDark);
    }),
    obj((g) => {
      // góc tường chữ L
      planks(g, 0, 0, 10, 32, 5, true);
      planks(g, 10, 0, 22, 10, 5, false);
      R(g, 9, 0, 2, 32, C.woodDark);
    }),
    obj((g) => {
      // khung ô chuồng trống (chưa lắp cửa)
      post(g, 2, 2, 30);
      post(g, 27, 2, 30);
      R(g, 2, 2, 28, 3, C.wood);
      R(g, 2, 2, 28, 1, C.woodHi);
    }),
    obj((g) => {
      // cánh cửa gỗ rời, nẹp chữ Z
      planks(g, 6, 3, 20, 26, 5, true);
      R(g, 6, 6, 20, 2, C.woodDark);
      R(g, 6, 24, 20, 2, C.woodDark);
      for (let i = 0; i < 16; i++) R(g, 8 + i, 23 - i, 2, 1, C.woodDark);
    }),
  ],
  [
    obj((g) => {
      // cửa chuồng đóng (cửa kiểu Hà Lan, nửa trên song)
      post(g, 1, 1, 31);
      post(g, 28, 1, 31);
      planks(g, 4, 14, 24, 17, 4, true);
      R(g, 4, 4, 24, 10, C.woodDark);
      for (let x = 6; x < 28; x += 4) R(g, x, 4, 1, 10, C.iron);
      R(g, 4, 13, 24, 2, C.woodHi);
      R(g, 24, 21, 2, 2, C.ironDark);
    }),
    obj((g) => {
      // cửa mở hé — lộ khoảng tối bên trong
      post(g, 1, 1, 31);
      post(g, 28, 1, 31);
      R(g, 4, 4, 24, 27, C.dark);
      planks(g, 10, 4, 18, 27, 4, true);
      R(g, 10, 4, 1, 27, C.woodDark);
    }),
    obj((g) => {
      // cửa mở hẳn — cánh gập sát cột phải
      post(g, 1, 1, 31);
      post(g, 28, 1, 31);
      R(g, 4, 4, 24, 27, C.dark);
      strawBase(g, 5, true);
      R(g, 4, 0, 24, 4, [0, 0, 0, 0]);
      R(g, 0, 0, 4, 32, [0, 0, 0, 0]);
      R(g, 28, 0, 4, 32, [0, 0, 0, 0]);
      post(g, 1, 1, 31);
      post(g, 28, 1, 31);
      R(g, 4, 4, 24, 3, C.dark);
      planks(g, 24, 4, 4, 27, 2, true);
    }),
    (g) => strawBase(g, 21, false), // nền rơm mỏng
    (g) => strawBase(g, 22, true), // nền rơm dày
    obj((g) => {
      // bảng tên ô chuồng (trống, treo xích)
      R(g, 9, 2, 1, 7, C.ironDark);
      R(g, 22, 2, 1, 7, C.ironDark);
      R(g, 5, 9, 22, 13, C.woodLight);
      R(g, 6, 10, 20, 11, C.woodHi);
      R(g, 5, 21, 22, 1, C.woodDark);
      P(g, 7, 11, C.ironDark);
      P(g, 24, 11, C.ironDark);
    }),
  ],
  [
    obj((g) => trough(g, C.grassLight, C.grassDark, true)), // máng cỏ đầy
    obj((g) => trough(g, C.grassLight, C.grassDark, false)),
    obj((g) => trough(g, C.straw, C.strawDark, true)), // máng ngũ cốc đầy
    obj((g) => trough(g, C.straw, C.strawDark, false)),
    obj((g) => {
      trough(g, C.water, C.waterDark, true); // máng nước đầy
      R(g, 7, 17, 5, 1, C.waterLight);
    }),
    obj((g) => trough(g, null, C.woodDark, false)), // máng nước cạn
  ],
  [
    obj((g) => {
      // đèn treo tắt
      R(g, 15, 1, 2, 8, C.ironDark);
      R(g, 11, 9, 10, 2, C.ironDark);
      R(g, 12, 11, 8, 10, C.glassDark);
      R(g, 13, 12, 2, 6, C.glass);
      R(g, 11, 21, 10, 2, C.ironDark);
    }),
    (g) => {
      // đèn treo sáng (quầng sáng mờ quanh đèn)
      E(g, 16, 16, 15, 13, hex("#FFE9A0", 70));
      E(g, 16, 16, 9, 8, hex("#FFE9A0", 120));
      const lamp = new Img(32, 32);
      R(lamp, 15, 1, 2, 8, C.ironDark);
      R(lamp, 11, 9, 10, 2, C.ironDark);
      R(lamp, 12, 11, 8, 10, C.lampGlow);
      R(lamp, 14, 13, 4, 5, C.white);
      R(lamp, 11, 21, 10, 2, C.ironDark);
      outline(lamp, C.ink);
      g.blit(lamp, 0, 0);
    },
    obj((g) => {
      // móc sắt chữ J trên tấm ván nhỏ
      R(g, 10, 6, 12, 6, C.woodLight);
      R(g, 15, 12, 2, 8, C.iron);
      R(g, 15, 19, 6, 2, C.iron);
      R(g, 19, 16, 2, 4, C.iron);
    }),
    obj((g) => {
      // móc có dây cương da
      R(g, 10, 4, 12, 6, C.woodLight);
      R(g, 15, 10, 2, 5, C.iron);
      for (let i = 0; i < 14; i++) R(g, 12 + Math.round(Math.sin(i / 2) * 3), 14 + i, 2, 1, C.woodDark);
      R(g, 18, 15, 2, 12, C.woodDark);
      R(g, 13, 27, 7, 2, C.woodDark);
    }),
    obj((g) => {
      shade(g, 16, 27, 12);
      bale(g, 5, 11, 22, 15); // kiện rơm khô
    }),
    obj((g) => {
      shade(g, 16, 28, 9);
      sack(g, 10, 10); // bao cám
    }),
  ],
  // H5 — viền Rule C (#00E5FF, dày 3 px) để code phủ màu trạng thái
  [
    (g) => {
      R(g, 0, 0, 32, 3, C.rule);
      R(g, 0, 0, 3, 32, C.rule);
    },
    (g) => R(g, 0, 0, 32, 3, C.rule),
    (g) => {
      R(g, 0, 0, 32, 3, C.rule);
      R(g, 29, 0, 3, 32, C.rule);
    },
    (g) => R(g, 0, 0, 3, 32, C.rule),
    (g) => {
      R(g, 0, 29, 32, 3, C.rule);
      R(g, 0, 0, 3, 32, C.rule);
    },
    (g) => {
      R(g, 0, 29, 32, 3, C.rule);
      R(g, 29, 0, 3, 32, C.rule);
    },
  ],
  [
    ...[C.fit, C.watch, C.injured, C.isolated].map((col, i): Draw => (g) => {
      strawBase(g, 30 + i, true);
      R(g, 0, 0, 32, 3, col);
      R(g, 0, 0, 3, 32, col);
      if (i === 2) {
        // đỏ = chấn thương: dấu "!"
        R(g, 21, 6, 6, 18, C.ink);
        R(g, 22, 7, 4, 10, C.red);
        R(g, 22, 19, 4, 4, C.red);
      }
    }),
    obj((g) => {
      // chân cột gia cố
      post(g, 13, 0, 26);
      R(g, 9, 24, 14, 6, C.stone);
      R(g, 9, 24, 14, 1, C.stoneLight);
      R(g, 9, 29, 14, 1, C.stoneDark);
    }),
    (g) => roofTile(g, C.roofGray, C.roofGrayDark, C.roofGrayLight, "metal"), // mái tôn chuồng
  ],
];

// ------------------------------------------------------------------ S08 — Khu trang trại

const inRoadH = (_x: number, y: number) => y >= 9 && y <= 22;
const inRoadV = (x: number) => x >= 9 && x <= 22;

const S08: Draw[][] = [
  [
    (g) => grassBase(g, 1, 0.1), // cỏ thường
    (g) => {
      grassBase(g, 2, 0.16); // cỏ dày (cụm cỏ chữ V)
      for (const [x, y] of [[5, 8], [19, 5], [12, 20], [26, 22], [3, 27], [24, 13]])
        for (let k = 0; k < 3; k++) {
          P(g, x + k, y - k, C.grassHi);
          P(g, x + 4 - k, y - k, C.grassHi);
          P(g, x + 2, y - k, C.grassDark);
        }
    },
    (g) => {
      grassBase(g, 3, 0.1); // cỏ hoa dại
      const fl = [C.flowerRed, C.flowerYellow, C.flowerPink, C.white];
      for (let i = 0; i < 9; i++) {
        const x = 2 + Math.floor(hash(i, 9, 3) * 28);
        const y = 2 + Math.floor(hash(i, 8, 3) * 28);
        const c = fl[i % 4];
        P(g, x, y - 1, c);
        P(g, x - 1, y, c);
        P(g, x + 1, y, c);
        P(g, x, y + 1, c);
        P(g, x, y, C.flowerYellow);
      }
    },
    (g) => {
      grassBase(g, 4); // viền cỏ giáp đường (cỏ trên, đất dưới)
      dirtFill(g, (x, y) => y >= 16 + Math.round(Math.sin((x / 32) * Math.PI * 2) * 2));
    },
    (g) => {
      grassBase(g, 5); // đường đất ngang
      dirtFill(g, (x, y) => inRoadH(x, y));
    },
    (g) => {
      grassBase(g, 6); // đường đất cong (nối trái ↔ dưới)
      dirtFill(g, (x, y) => {
        const d = Math.hypot(x + 0.5, 32 - (y + 0.5));
        return d >= 9 && d <= 23;
      });
    },
  ],
  [
    (g) => {
      grassBase(g, 7); // ngã tư
      dirtFill(g, (x, y) => inRoadH(x, y) || inRoadV(x));
    },
    obj((g) => {
      // rào gỗ ngang (lặp ngang liền: cột ở x 6 và 22, thanh ngang chạy suốt)
      shade(g, 16, 28, 16, 1.5);
      R(g, 0, 12, 32, 3, C.woodLight);
      R(g, 0, 19, 32, 3, C.woodLight);
      R(g, 0, 12, 32, 1, C.woodHi);
      R(g, 0, 19, 32, 1, C.woodHi);
      post(g, 6, 8, 28);
      post(g, 22, 8, 28);
    }),
    obj((g) => {
      // rào dọc (nhìn từ trên: thanh dọc + cột tròn)
      R(g, 13, 0, 3, 32, C.woodLight);
      R(g, 17, 0, 2, 32, C.wood);
      for (const y of [6, 22]) {
        R(g, 12, y, 8, 6, C.wood);
        R(g, 12, y, 8, 2, C.woodHi);
      }
    }),
    obj((g) => {
      // rào góc chữ L (đi sang phải và xuống dưới)
      R(g, 13, 12, 19, 3, C.woodLight);
      R(g, 13, 19, 19, 3, C.woodLight);
      R(g, 13, 12, 3, 20, C.woodLight);
      R(g, 17, 22, 2, 10, C.wood);
      post(g, 13, 8, 28);
      post(g, 24, 8, 28);
    }),
    obj((g) => {
      // cổng bãi thả đóng (cánh gỗ có thanh chéo)
      shade(g, 16, 28, 15, 1.5);
      post(g, 1, 4, 29);
      post(g, 28, 4, 29);
      R(g, 4, 9, 24, 3, C.woodLight);
      R(g, 4, 15, 24, 3, C.woodLight);
      R(g, 4, 21, 24, 3, C.woodLight);
      for (let i = 0; i < 22; i++) R(g, 5 + i, 22 - Math.round(i * 0.6), 2, 2, C.wood);
    }),
    obj((g) => {
      // cổng bãi thả mở (cánh xoay vuông góc, thấy cạnh)
      shade(g, 16, 28, 15, 1.5);
      post(g, 1, 4, 29);
      post(g, 28, 4, 29);
      R(g, 4, 9, 4, 15, C.woodLight);
      R(g, 4, 9, 1, 15, C.woodHi);
      for (const y of [10, 16, 22]) R(g, 4, y, 6, 1, C.wood);
    }),
  ],
  [
    obj((g) => {
      // tán cây to (phần trên của cây 2 ô)
      E(g, 16, 19, 15, 13, C.leafDark);
      E(g, 14, 16, 13, 11, C.leaf);
      E(g, 11, 12, 7, 6, C.leafLight);
      speckle(g, 1, 4, 30, 28, C.leafDark, 0.12, 31, C.leaf);
      speckle(g, 1, 4, 30, 20, C.leafLight, 0.06, 32, C.leaf);
    }),
    obj((g) => {
      // thân cây + rễ (ghép dưới tán)
      shade(g, 16, 27, 12, 3);
      E(g, 16, 2, 13, 6, C.leafDark); // mép dưới tán phủ xuống
      R(g, 12, 4, 8, 21, C.wood);
      R(g, 12, 4, 2, 21, C.woodLight);
      R(g, 18, 4, 2, 21, C.woodDark);
      R(g, 8, 23, 6, 3, C.wood);
      R(g, 18, 23, 6, 3, C.wood);
      R(g, 15, 10, 2, 3, C.woodDark);
    }),
    obj((g) => {
      // bụi cây rậm
      shade(g, 16, 27, 13);
      E(g, 16, 18, 13, 9, C.leafDark);
      E(g, 14, 16, 10, 7, C.leaf);
      E(g, 11, 13, 5, 3, C.leafLight);
      speckle(g, 3, 9, 26, 18, C.leafDark, 0.12, 41, C.leaf);
    }),
    obj((g) => {
      // khóm hoa rực rỡ
      shade(g, 16, 27, 12);
      E(g, 16, 19, 12, 8, C.leafDark);
      E(g, 15, 17, 9, 6, C.leaf);
      const fl = [C.flowerYellow, C.orange, C.flowerRed, C.flowerYellow];
      for (let i = 0; i < 11; i++) {
        const x = 7 + Math.floor(hash(i, 1, 51) * 18);
        const y = 11 + Math.floor(hash(i, 2, 51) * 12);
        R(g, x, y, 2, 2, fl[i % 4]);
        P(g, x, y, C.goldLight);
      }
    }),
    (g) => {
      // bờ ao — góc (nước ở góc dưới-phải, bờ đá vòng cung)
      grassBase(g, 61);
      for (let y = 0; y < 32; y++)
        for (let x = 0; x < 32; x++) {
          const d = Math.hypot(32 - (x + 0.5), 32 - (y + 0.5));
          if (d < 20) g.set(x, y, hash(x, y, 9) < 0.08 ? C.waterLight : d > 16 ? C.waterDark : C.water);
          else if (d < 23) g.set(x, y, hash(x, y, 8) < 0.5 ? C.stone : C.stoneLight);
          else if (d < 24) g.set(x, y, C.stoneDark);
        }
    },
    (g) => {
      // bờ ao — cạnh (nước nửa dưới, lặp ngang)
      grassBase(g, 62);
      R(g, 0, 12, 32, 20, C.water);
      R(g, 0, 12, 32, 3, C.waterDark);
      speckle(g, 0, 15, 32, 17, C.waterLight, 0.05, 63);
      for (let x = 0; x < 32; x++) {
        g.set(x, 9, hash(x, 0, 6) < 0.5 ? C.stone : C.stoneLight);
        g.set(x, 10, hash(x, 1, 6) < 0.5 ? C.stoneLight : C.stone);
        g.set(x, 11, C.stoneDark);
      }
    },
  ],
  [
    obj((g) => {
      // kiện cỏ khô xếp chồng
      shade(g, 16, 29, 14);
      bale(g, 2, 16, 13, 12);
      bale(g, 16, 16, 13, 12);
      bale(g, 9, 5, 13, 12);
    }),
    obj((g) => {
      shade(g, 16, 29, 13);
      sack(g, 4, 11);
      sack(g, 15, 9); // hai bao cám
    }),
    (g) => roofTile(g, C.roofGray, C.roofGrayDark, C.roofGrayLight, "shingle"), // mái nhà kho
    (g) => {
      // tường kho + cửa lớn
      planks(g, 0, 0, 32, 30, 4, true);
      R(g, 0, 0, 32, 3, C.woodDark);
      R(g, 6, 8, 20, 22, C.woodDark);
      R(g, 8, 10, 16, 20, C.dark);
      R(g, 8, 24, 16, 6, C.straw); // rơm trong kho
      speckle(g, 8, 24, 16, 6, C.strawDark, 0.3, 71);
      R(g, 0, 30, 32, 2, C.stoneDark);
    },
    (g) => roofTile(g, C.roofRed, C.roofRedDark, C.roofRedLight, "tile"), // mái văn phòng
    (g) => {
      // tường văn phòng + cửa sổ 3 ô
      wallTile(g, C.wallWhite, C.wallShade);
      windowAt(g, 5, 8, 22, 12, 3);
    },
  ],
  [
    (g) => roofTile(g, C.roofBlue, C.roofBlueDark, C.roofBlueLight, "metal"), // mái phòng khám
    (g) => {
      // tường y tế + chữ thập
      wallTile(g, C.wallWhite, C.wallShade);
      crossSign(g, 16, 15, 6, C.red, C.white);
      R(g, 9, 7, 15, 1, C.ink);
    },
    (g) => {
      // cửa phòng khám
      wallTile(g, C.wallWhite, C.wallShade);
      R(g, 9, 6, 14, 24, C.woodDark);
      R(g, 10, 7, 12, 23, C.woodLight);
      R(g, 11, 9, 10, 8, C.wood);
      R(g, 11, 19, 10, 9, C.wood);
      R(g, 19, 18, 2, 2, C.gold);
    },
    (g) => {
      wallTile(g, C.wallWhite, C.wallShade); // cửa sổ nhỏ
      windowAt(g, 9, 8, 14, 12, 2);
    },
    obj((g) => {
      // biển chỉ dẫn chữ thập cắm đất
      shade(g, 16, 29, 6);
      post(g, 15, 14, 29);
      R(g, 6, 3, 20, 13, C.woodLight);
      R(g, 7, 4, 18, 11, C.white);
      crossSign(g, 16, 9, 3, C.blue, C.white);
    }),
    obj((g) => {
      // đống rơm + chĩa ba
      shade(g, 14, 28, 13);
      E(g, 14, 22, 12, 7, C.strawDark);
      E(g, 13, 20, 10, 6, C.straw);
      speckle(g, 3, 14, 22, 14, C.strawLight, 0.15, 81, C.straw);
      R(g, 22, 4, 2, 22, C.woodLight);
      for (const x of [20, 23, 26]) R(g, x, 2, 1, 4, C.iron);
      R(g, 20, 5, 7, 1, C.iron);
    }),
  ],
  [
    obj((g) => {
      // gốc cây đã đốn
      shade(g, 16, 26, 11);
      R(g, 8, 13, 16, 12, C.wood);
      R(g, 8, 13, 3, 12, C.woodLight);
      E(g, 16, 13, 8, 3, C.woodHi);
      E(g, 16, 13, 5, 2, C.dirtLight);
      P(g, 16, 13, C.woodDark);
      R(g, 4, 23, 5, 3, C.wood);
      R(g, 23, 23, 5, 3, C.wood);
    }),
    (g) => {
      grassBase(g, 91); // vệt bánh xe trên cỏ (đất hai vệt song song)
      dirtFill(g, (x, y) => (y >= 10 && y <= 12) || (y >= 19 && y <= 21), 92);
    },
    obj((g) => {
      // rào hỏng
      post(g, 4, 9, 28);
      R(g, 7, 12, 14, 3, C.woodLight);
      for (let i = 0; i < 16; i++) R(g, 8 + i, 18 + Math.round(i * 0.5), 2, 2, C.woodLight);
      post(g, 25, 16, 28);
    }),
    obj((g) => {
      // khóm cây dại nhỏ
      for (const [x, h] of [[8, 14], [11, 18], [14, 12], [17, 20], [20, 15], [23, 11]])
        for (let k = 0; k < h; k++) P(g, x + Math.round(Math.sin(k / 3)), 28 - k, k > h - 4 ? C.grassHi : C.leaf);
      E(g, 16, 27, 10, 3, C.leafDark);
    }),
    obj((g) => {
      // cụm đá cuội
      shade(g, 16, 27, 13);
      E(g, 12, 21, 7, 5, C.stone);
      E(g, 11, 19, 4, 2, C.stoneLight);
      E(g, 22, 23, 5, 4, C.stoneDark);
      E(g, 21, 22, 3, 1.5, C.stone);
      E(g, 19, 27, 3, 2, C.stone);
    }),
    obj((g) => {
      // giếng đá rêu
      shade(g, 16, 29, 14);
      E(g, 16, 20, 13, 8, C.stoneDark);
      E(g, 16, 18, 13, 8, C.stone);
      E(g, 16, 17, 9, 5, C.waterDark);
      E(g, 15, 16, 4, 2, C.water);
      speckle(g, 3, 10, 26, 16, C.leafLight, 0.06, 99, C.stone);
      for (let x = 4; x < 29; x += 5) P(g, x, 22, C.stoneLight);
    }),
  ],
];

// ------------------------------------------------------------------ S10 — Thi đấu

function gate(g: Img, open: number) {
  // một ô cổng xuất phát nhìn chính diện: khung xanh + 2 cánh lưới (open 0 → 1)
  R(g, 1, 2, 30, 4, C.green);
  R(g, 1, 2, 30, 1, C.grassHi);
  R(g, 1, 2, 3, 28, C.green);
  R(g, 28, 2, 3, 28, C.green);
  R(g, 4, 6, 24, 24, C.dark);
  const w = Math.round(12 * (1 - open));
  for (const side of [0, 1]) {
    const x0 = side ? 28 - w : 4;
    if (w <= 0) continue;
    R(g, x0, 7, w, 22, C.red);
    for (let y = 9; y < 28; y += 4) R(g, x0, y, w, 1, C.white);
    R(g, x0, 7, 1, 22, C.redDark);
  }
  if (open > 0) for (const x of [4, 26]) R(g, x, 7, 2, 22, C.redDark); // cánh gập sát khung
}

function trophy(g: Img, body: RGBA, dark: RGBA, light: RGBA) {
  shade(g, 16, 29, 9);
  E(g, 16, 11, 8, 7, body);
  R(g, 8, 4, 17, 6, body);
  R(g, 8, 4, 17, 1, light);
  E(g, 12, 9, 2, 3, light);
  E(g, 5, 9, 3, 4, [0, 0, 0, 0]);
  for (const x of [4, 26]) {
    R(g, x, 6, 2, 7, body);
    R(g, x + (x < 16 ? 2 : -2), 12, 2, 2, body);
  }
  R(g, 14, 18, 4, 4, dark);
  R(g, 10, 22, 12, 3, body);
  R(g, 9, 25, 14, 3, dark);
}

function medal(g: Img, body: RGBA, dark: RGBA, ribbon: RGBA) {
  for (let i = 0; i < 12; i++) {
    R(g, 8 + Math.round(i * 0.5), 2 + i, 3, 1, ribbon);
    R(g, 21 - Math.round(i * 0.5), 2 + i, 3, 1, ribbon);
  }
  E(g, 16, 21, 7, 7, dark);
  E(g, 16, 21, 6, 6, body);
  E(g, 14, 19, 2, 2, C.white);
  R(g, 15, 18, 2, 6, dark);
}

function crowdDots(g: Img, rows: number, seed: number, cheer: boolean) {
  const shirts = [C.red, C.blue, C.flowerYellow, C.green, C.orange, C.purple, C.white];
  for (let r = 0; r < rows; r++)
    for (let x = 1; x < 31; x += 5) {
      const y = 6 + r * 8 + (cheer && hash(x, r, seed) < 0.5 ? -1 : 0);
      R(g, x, y + 3, 4, 4, shirts[Math.floor(hash(x, r, seed + 1) * shirts.length)]);
      R(g, x + 1, y, 2, 3, C.skin);
      if (cheer && hash(x, r, seed + 2) < 0.4) R(g, x + 3, y - 2, 1, 3, C.skin);
    }
}

const S10: Draw[][] = [
  [
    obj((g) => gate(g, 0)), // cổng xuất phát đóng
    obj((g) => gate(g, 0.5)), // đang mở
    obj((g) => gate(g, 1)), // mở hẳn
    (g) => {
      // vạch đích caro trên mặt sân (lặp ngang/dọc)
      for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) g.set(x, y, (Math.floor(x / 4) + Math.floor(y / 4)) % 2 ? C.ink : C.white);
    },
    obj((g) => {
      // cột mốc đích sọc đỏ trắng + cờ + quả cầu
      shade(g, 16, 30, 5);
      stripePole(g, 15, 6, 30, C.red, C.white);
      E(g, 16, 4, 3, 3, C.gold);
      R(g, 18, 7, 9, 6, C.red);
      R(g, 18, 7, 9, 1, C.white);
    }),
    obj((g) => {
      // bảng điện tử (tối, viền đèn đỏ/xanh)
      R(g, 2, 4, 28, 18, C.dark);
      for (let x = 3; x < 29; x += 3) {
        P(g, x, 5, x % 2 ? C.red : C.green);
        P(g, x, 20, x % 2 ? C.green : C.red);
      }
      R(g, 5, 8, 22, 10, hex("#14181C"));
      R(g, 9, 22, 3, 8, C.ironDark);
      R(g, 20, 22, 3, 8, C.ironDark);
    }),
  ],
  [
    (g) => roofTile(g, C.roofRed, C.roofRedDark, C.roofRedLight, "metal"), // mái khán đài
    (g) => {
      // bậc ngồi trống (lặp)
      for (let r = 0; r < 4; r++) {
        R(g, 0, r * 8, 32, 6, C.woodLight);
        R(g, 0, r * 8, 32, 1, C.woodHi);
        R(g, 0, r * 8 + 6, 32, 2, C.woodDark);
      }
    },
    (g) => {
      // khán đài đông người
      for (let r = 0; r < 4; r++) {
        R(g, 0, r * 8, 32, 6, C.woodLight);
        R(g, 0, r * 8 + 6, 32, 2, C.woodDark);
      }
      crowdDots(g, 4, 3, false);
    },
    obj((g) => crowdDots(g, 3, 7, true)), // khán giả cổ vũ (giơ tay)
    obj((g) => {
      // bục vinh quang 1-2-3
      R(g, 11, 8, 10, 22, C.silver);
      R(g, 2, 15, 9, 15, C.silverDark);
      R(g, 21, 19, 9, 11, C.stoneLight);
      R(g, 11, 8, 10, 2, C.white);
      R(g, 15, 12, 2, 6, C.gold);
      R(g, 5, 19, 3, 2, C.gold);
      R(g, 6, 21, 2, 3, C.gold);
      R(g, 24, 22, 3, 1, C.gold);
      R(g, 25, 23, 2, 3, C.gold);
    }),
    obj((g) => {
      // giàn loa + máy quay
      R(g, 6, 12, 2, 18, C.ironDark);
      R(g, 24, 12, 2, 18, C.ironDark);
      R(g, 4, 12, 24, 2, C.iron);
      R(g, 4, 4, 8, 8, C.dark);
      E(g, 8, 8, 2.5, 2.5, C.iron);
      R(g, 18, 6, 10, 6, C.dark);
      R(g, 26, 7, 4, 4, C.ironDark);
      P(g, 20, 7, C.red);
    }),
  ],
  [
    obj((g) => trophy(g, C.gold, C.goldDark, C.goldLight)),
    obj((g) => trophy(g, C.silver, C.silverDark, C.white)),
    obj((g) => trophy(g, C.bronze, C.bronzeDark, hex("#E0A060"))),
    obj((g) => medal(g, C.gold, C.goldDark, C.red)),
    obj((g) => medal(g, C.silver, C.silverDark, C.blue)),
    obj((g) => medal(g, C.bronze, C.bronzeDark, C.green)),
  ],
  [
    obj((g) => {
      // nơ danh hiệu (rosette)
      R(g, 11, 17, 4, 13, C.blue);
      R(g, 17, 17, 4, 13, C.red);
      E(g, 16, 13, 10, 10, C.red);
      E(g, 16, 13, 7, 7, C.blue);
      E(g, 16, 13, 4, 4, C.gold);
    }),
    obj((g) => {
      // túi tiền thưởng
      shade(g, 16, 29, 10);
      E(g, 16, 20, 11, 9, C.gold);
      E(g, 13, 17, 4, 3, C.goldLight);
      R(g, 12, 6, 8, 6, C.goldDark);
      R(g, 11, 10, 10, 2, C.woodDark);
      R(g, 14, 18, 4, 7, C.goldDark);
      R(g, 13, 19, 6, 1, C.goldDark);
      R(g, 13, 23, 6, 1, C.goldDark);
    }),
    obj((g) => {
      // cờ hiệu lệnh đỏ
      R(g, 8, 3, 2, 27, C.woodLight);
      R(g, 10, 4, 16, 11, C.red);
      R(g, 10, 4, 16, 1, C.flowerRed);
      R(g, 22, 15, 4, 0, C.red);
    }),
    obj((g) => {
      // cờ caro hiệu đích
      R(g, 8, 3, 2, 27, C.woodLight);
      for (let y = 0; y < 12; y++) for (let x = 0; x < 16; x++) g.set(10 + x, 4 + y, (Math.floor(x / 3) + Math.floor(y / 3)) % 2 ? C.ink : C.white);
    }),
    obj((g) => {
      // vòng nguyệt quế
      for (let a = 0; a < 26; a++) {
        const t = (a / 26) * Math.PI * 1.75 + Math.PI * 0.62;
        const x = 16 + Math.cos(t) * 11;
        const y = 15 + Math.sin(t) * 11;
        E(g, x, y, 2.2, 1.4, a % 2 ? C.leaf : C.leafLight);
      }
      R(g, 13, 26, 6, 3, C.red);
    }),
    obj((g) => {
      // dải cờ hoa tam giác (lặp ngang)
      for (let x = 0; x < 32; x++) P(g, x, 4 + Math.round(Math.sin((x / 32) * Math.PI) * 3), C.woodDark);
      const cols = [C.red, C.flowerYellow, C.blue, C.green];
      for (let i = 0; i < 4; i++) {
        const x0 = 1 + i * 8;
        const y0 = 5 + Math.round(Math.sin(((x0 + 3) / 32) * Math.PI) * 3);
        for (let k = 0; k < 6; k++) R(g, x0 + Math.floor(k / 2), y0 + k, 6 - Math.floor(k / 2) * 2, 1, cols[i]);
      }
    }),
  ],
  [
    obj((g) => {
      // rào chắn đỏ trắng
      shade(g, 16, 29, 15, 1.5);
      R(g, 2, 10, 28, 8, C.white);
      for (let x = 2; x < 30; x += 8) R(g, x, 10, 4, 8, C.red);
      R(g, 4, 18, 3, 11, C.ironDark);
      R(g, 25, 18, 3, 11, C.ironDark);
    }),
    obj((g) => {
      // hàng rào di động lưới sắt
      R(g, 2, 6, 28, 2, C.iron);
      R(g, 2, 22, 28, 2, C.iron);
      R(g, 2, 6, 2, 24, C.iron);
      R(g, 28, 6, 2, 24, C.iron);
      for (let x = 5; x < 28; x += 3) R(g, x, 8, 1, 14, C.silverDark);
      R(g, 0, 28, 7, 2, C.ironDark);
      R(g, 25, 28, 7, 2, C.ironDark);
    }),
    obj((g) => {
      shade(g, 16, 30, 4);
      stripePole(g, 14, 4, 30, C.red, C.white); // cọc sọc phân làn
      R(g, 13, 3, 5, 2, C.red);
    }),
    obj((g) => {
      // đèn tín hiệu đỏ-vàng-xanh
      R(g, 15, 22, 2, 8, C.ironDark);
      R(g, 10, 2, 12, 21, C.dark);
      E(g, 16, 6, 3, 3, C.red);
      E(g, 16, 12, 3, 3, C.flowerYellow);
      E(g, 16, 18, 3, 3, C.green);
    }),
    obj((g) => {
      // băng rôn đỏ chăng ngang (lặp ngang)
      R(g, 0, 8, 32, 12, C.red);
      R(g, 0, 8, 32, 2, C.flowerRed);
      R(g, 0, 18, 32, 2, C.redDark);
      for (let x = 2; x < 32; x += 8) R(g, x, 13, 4, 2, C.goldLight);
    }),
    (g) => {
      // pháo giấy
      const cols = [C.red, C.flowerYellow, C.blue, C.green, C.flowerPink, C.orange];
      for (let i = 0; i < 26; i++) R(g, Math.floor(hash(i, 1, 7) * 30), Math.floor(hash(i, 2, 7) * 30), 2, hash(i, 3, 7) < 0.5 ? 1 : 2, cols[i % 6]);
    },
  ],
  [
    (g) => {
      // cổng chào — phần mái + dải cờ
      roofTile(g, C.roofRed, C.roofRedDark, C.roofRedLight, "tile");
      const cols = [C.flowerYellow, C.blue, C.green, C.white];
      for (let i = 0; i < 4; i++) for (let k = 0; k < 3; k++) R(g, 2 + i * 8 + k, 24 + k, 5 - k * 2, 1, cols[i]); // cờ tam giác rủ dưới mái
    },
    obj((g) => {
      // trụ cổng chào (gạch)
      R(g, 9, 0, 14, 30, C.roofRedDark);
      for (let y = 0; y < 30; y += 4) {
        R(g, 9, y, 14, 1, C.woodDark);
        R(g, 9 + ((y / 4) % 2 ? 7 : 3), y, 1, 4, C.woodDark);
      }
      R(g, 7, 28, 18, 3, C.stone);
      R(g, 7, 28, 18, 1, C.stoneLight);
    }),
    (g) => {
      // thảm đỏ (lặp ngang) viền vàng
      R(g, 0, 8, 32, 16, C.red);
      R(g, 0, 8, 32, 2, C.gold);
      R(g, 0, 22, 32, 2, C.gold);
      speckle(g, 0, 10, 32, 12, C.redDark, 0.06, 5);
    },
    obj((g) => {
      // máy quay trên giá ba chân
      R(g, 8, 6, 14, 9, C.dark);
      R(g, 22, 8, 5, 5, C.ironDark);
      E(g, 26, 10, 2, 2, C.glass);
      P(g, 10, 7, C.red);
      for (let i = 0; i < 14; i++) {
        P(g, 15, 15 + i, C.iron);
        P(g, 15 - Math.round(i * 0.5), 15 + i, C.iron);
        P(g, 15 + Math.round(i * 0.5), 15 + i, C.iron);
      }
    }),
    obj((g) => {
      // bồn hoa đỏ
      R(g, 6, 18, 20, 11, C.bronzeDark);
      R(g, 6, 18, 20, 2, C.bronze);
      E(g, 16, 14, 11, 6, C.leaf);
      for (let i = 0; i < 9; i++) R(g, 7 + Math.floor(hash(i, 1, 2) * 17), 9 + Math.floor(hash(i, 2, 2) * 8), 3, 3, C.flowerRed);
    }),
    obj((g) => {
      // cờ phướn dọc sọc xanh đỏ
      R(g, 8, 1, 2, 30, C.woodLight);
      R(g, 10, 3, 14, 2, C.woodDark);
      for (let y = 5; y < 27; y++) R(g, 10, y, 13, 1, Math.floor((y - 5) / 4) % 2 ? C.blue : C.red);
      for (let k = 0; k < 4; k++) R(g, 10 + k * 3, 27, 2, 1 + (k % 2), C.red);
    }),
  ],
];

// ------------------------------------------------------------------ Xuất + kiểm

const root = new URL("../..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const outputs: [string, Draw[][]][] = [
  ["s07-stall", S07],
  ["s08-farm", S08],
  ["s10-arena", S10],
];
const built: Record<string, Img> = {};
for (const [name, rows] of outputs) {
  assert.equal(rows.length, 6, `${name}: phải đủ 6 hàng`);
  rows.forEach((r, i) => assert.equal(r.length, 6, `${name} hàng ${i + 1}: phải đủ 6 ô`));
  const img = make(rows);
  built[name] = img;
  savePng(`${root}art/png/${name}.png`, img);
  savePng(`${root}art/preview/${name}-x4.png`, preview(img, 4));
  copyFileSync(`${root}art/png/${name}.png`, `${root}public/assets/sprites/${name}.png`);
}

/** Kiểm ghép liền: cạnh trái = cạnh phải, cạnh trên = cạnh dưới (cho ô nền lặp). */
function seamless(img: Img, col: number, row: number, axis: "x" | "y" | "xy"): boolean {
  const x0 = col * 32;
  const y0 = row * 32;
  // Hạt rắc khác màu ở hai mép là bình thường; mối nối chỉ lộ khi "loại nền" khác nhau (cỏ ↔ đất).
  // Cho phép lệch 1 px do mép cỏ lởm chởm.
  const kind = (c: RGBA) => (c[0] > c[1] ? "dirt" : "grass");
  let mismatch = 0;
  for (let i = 0; i < 32; i++) {
    if (axis !== "y" && kind(img.get(x0, y0 + i)) !== kind(img.get(x0 + 31, y0 + i))) mismatch++;
    if (axis !== "x" && kind(img.get(x0 + i, y0)) !== kind(img.get(x0 + i, y0 + 31))) mismatch++;
  }
  return mismatch <= 2;
}
assert.ok(seamless(built["s08-farm"], 0, 0, "xy"), "cỏ thường phải ghép liền");
assert.ok(seamless(built["s08-farm"], 4, 0, "x"), "đường ngang phải ghép liền theo chiều ngang");
assert.ok(seamless(built["s07-stall"], 4, 1, "xy"), "rơm dày phải ghép liền");

// Bản đồ ghép thử (12×8 ô) để duyệt bố cục: cỏ, đường, ao, rào, cây, nhà kho, văn phòng, phòng khám, chuồng
const T = (name: string, c: number, r: number) => ({ src: built[name], c, r });
const map = new Img(12 * 32, 8 * 32);
const put = (t: { src: Img; c: number; r: number }, x: number, y: number, turn = false) => {
  const cell = new Img(32, 32);
  for (let j = 0; j < 32; j++) for (let i = 0; i < 32; i++) cell.set(i, j, t.src.get(t.c * 32 + i, t.r * 32 + j));
  map.blit(turn ? rotate90(cell) : cell, x * 32, y * 32);
};
const F = "s08-farm";
const S = "s07-stall";
for (let y = 0; y < 8; y++) for (let x = 0; x < 12; x++) put(T(F, (x * 7 + y * 3) % 5 === 0 ? 2 : 0, 0), x, y);
for (let x = 0; x < 12; x++) put(T(F, 4, 0), x, 5);
put(T(F, 0, 1), 6, 5);
for (let y = 6; y < 8; y++) put(T(F, 4, 0), 6, y, true); // đường dọc = đường ngang xoay 90°
// chuồng: mái tôn + cửa đóng/mở
for (let x = 0; x < 4; x++) put(T(S, 5, 5), x, 0);
[0, 1, 0, 2].forEach((c, x) => put(T(S, c, 1), x, 1));
// nhà kho
for (let x = 7; x < 10; x++) put(T(F, 2, 3), x, 0);
put(T(S, 1, 0), 7, 1);
put(T(F, 3, 3), 8, 1);
put(T(S, 1, 0), 9, 1);
// văn phòng + phòng khám
for (let x = 7; x < 9; x++) put(T(F, 4, 3), x, 3);
put(T(F, 5, 3), 7, 4);
put(T(F, 5, 3), 8, 4);
for (let x = 9; x < 12; x++) put(T(F, 0, 4), x, 3);
put(T(F, 3, 4), 9, 4);
put(T(F, 1, 4), 10, 4);
put(T(F, 2, 4), 11, 4);
// ao, rào, cây, hoa, cỏ khô
put(T(F, 4, 2), 1, 3);
for (let x = 2; x < 4; x++) put(T(F, 5, 2), x, 3);
for (let x = 1; x < 5; x++) put(T(F, 1, 1), x, 4);
put(T(F, 0, 2), 5, 2);
put(T(F, 1, 2), 5, 3);
put(T(F, 2, 2), 10, 6);
put(T(F, 3, 2), 0, 6);
put(T(F, 0, 3), 4, 6);
put(T(F, 5, 5), 11, 7);
savePng(`${root}art/preview/map-mock-x3.png`, map.scaled(3));
console.log("OK s07-stall, s08-farm, s10-arena (192×192) + map-mock");
