// Sinh S01 (ngựa Bay trơn, 6×6 khung 32×32) và S14 (lớp yên + nài) bằng code — vẽ lại theo mẫu concept đã duyệt.
// Chạy: node art/gen/horse.ts   → art/png/*.png + public/assets/sprites/*.png + art/preview/*.png
//
// Ngựa dựng theo khung xương nhìn ngang quay phải: thân/ngực/mông (elip), cổ + đầu (đa giác, xoay quanh gốc cổ),
// 4 chân mỗi chân 2 đoạn (vai/hông → gối → móng), đuôi, bờm. Mỗi khung = một bộ góc khớp; dáng đi lấy theo chu kỳ bước.
// Màu lông dùng ĐÚNG 8 mã hex dành riêng của SRS §12-A để code đổi màu (palette swap) chính xác.
import assert from "node:assert/strict";
import { copyFileSync, mkdirSync } from "node:fs";
import { deg, hex, Img, inCapsule, inEllipse, inPolygon, limb, outline, preview, rot, savePng, segT, sheet, type Pt, type RGBA } from "./pixel.ts";

// ------------------------------------------------------------------ Bảng màu (SRS §12)

export const COAT = {
  hi: hex("#B85C38"), // thân · sáng
  base: hex("#8B3C1B"), // thân · vừa
  shade: hex("#5A2510"), // thân · tối
  spec: hex("#D77B54"), // thân · bóng
  maneHi: hex("#2E2E2E"),
  mane: hex("#141414"),
  legHi: hex("#212121"),
  leg: hex("#0D0D0D"),
};
const FIXED = {
  outline: hex("#1D130E"),
  eye: hex("#050505"),
  nostril: hex("#201A15"),
  shadow: hex("#000000", 70),
  alert: hex("#E53935"),
};
export const SILK = { primary: hex("#D32F2F"), secondary: hex("#FFFFFF"), helmet: hex("#D32F2F") };
const RIDER = {
  skin: hex("#E8B48A"),
  pants: hex("#F2F2F2"),
  boots: hex("#0D0D0D"),
  saddle: hex("#4A2C1A"),
  saddleHi: hex("#6B4226"),
  girth: hex("#2B1A10"),
  reins: hex("#3B2416"),
};

// ------------------------------------------------------------------ Khung xương (tọa độ ô 32×32, mặt đất y = 30)

type LegName = "FN" | "FF" | "HN" | "HF"; // trước-gần, trước-xa, sau-gần, sau-xa
type Leg = readonly [number, number]; // [góc đoạn trên, độ gập đoạn dưới] (độ; góc dương = hướng về trước)

const JOINT: Record<LegName, Pt> = { FN: [20, 18], FF: [19, 17.6], HN: [9.6, 17.6], HF: [10.6, 17.2] };
const LEN: Record<LegName, [number, number]> = { FN: [5.6, 6.3], FF: [5.6, 6.3], HN: [5.8, 6.8], HF: [5.8, 6.8] };
const BODY_C: Pt = [14.5, 15.8];
const NECK_PIVOT: Pt = [21, 16];

interface Pose {
  legs: Record<LegName, Leg>;
  body?: { dx?: number; dy?: number; rot?: number; pivot?: Pt };
  head?: { dx?: number; dy?: number; rot?: number };
  tail?: number; // độ đung đưa đuôi (px)
  earBack?: boolean;
  alert?: boolean; // dấu "!" đỏ (khập khiễng)
}

interface Rider {
  hip: Pt;
  knee: Pt;
  ankle: Pt;
  shoulder: Pt;
  head: Pt;
  hand: Pt;
}

// ------------------------------------------------------------------ Biến đổi tọa độ

function bodyInv(p: Pt, pose: Pose): Pt {
  const b = pose.body ?? {};
  const q: Pt = [p[0] - (b.dx ?? 0), p[1] - (b.dy ?? 0)];
  return rot(q, b.pivot ?? [14.5, 17.5], -deg(b.rot ?? 0));
}

function headInv(l: Pt, pose: Pose): Pt {
  const h = pose.head ?? {};
  return rot([l[0] - (h.dx ?? 0), l[1] - (h.dy ?? 0)], NECK_PIVOT, -deg(h.rot ?? 0));
}

/** Vị trí miệng ngựa trong hệ thân (để dây cương bám theo đầu). */
function mouth(pose: Pose): Pt {
  const h = pose.head ?? {};
  const m = rot([29.2, 10.2], NECK_PIVOT, deg(h.rot ?? 0));
  return [m[0] + (h.dx ?? 0), m[1] + (h.dy ?? 0)];
}

function legPoints(name: LegName, leg: Leg): [Pt, Pt, Pt] {
  const j = JOINT[name];
  const knee = limb(j, leg[0], LEN[name][0]);
  const foot = limb(knee, leg[0] - leg[1], LEN[name][1]);
  return [j, knee, foot];
}

// ------------------------------------------------------------------ Màu tại một điểm (cục bộ thân ngựa)

function bodyShade(l: Pt): RGBA {
  if (inEllipse(l, [17.4, 13.4], 1.4, 0.55) || inEllipse(l, [9.2, 13.1], 1.1, 0.5)) return COAT.spec;
  const ny = (l[1] - BODY_C[1]) / 3.9;
  if (ny < -0.62) return COAT.hi;
  if (ny > 0.45) return COAT.shade;
  return COAT.base;
}

function legColor(l: Pt, name: LegName, pts: [Pt, Pt, Pt]): RGBA | null {
  const near = name === "FN" || name === "HN";
  const [j, k, f] = pts;
  if (inCapsule(l, k, f, near ? 0.95 : 0.85)) {
    if (segT(l, k, f) > 0.84) return COAT.leg; // móng
    return near ? COAT.legHi : COAT.leg;
  }
  if (inCapsule(l, j, k, near ? 1.45 : 1.25)) return near ? COAT.base : COAT.shade;
  return null;
}

function horseAt(p: Pt, pose: Pose, cellPx: Pt): RGBA | null {
  const l = bodyInv(p, pose);
  const h = headInv(l, pose);
  const legs = (Object.keys(JOINT) as LegName[]).map((n) => [n, legPoints(n, pose.legs[n])] as const);

  // thứ tự từ trên cùng xuống: mắt/mũi → chân gần → đầu → bờm → cổ → thân → đuôi → chân xa
  if (pose.alert) {
    const [cx, cy] = cellPx;
    if ((cx === 29 || cx === 30) && (cy <= 2 || cy === 4)) return FIXED.alert;
  }
  if (inEllipse(h, [26.6, 6.9], 0.55, 0.55)) return FIXED.eye;
  if (inEllipse(h, [30.1, 9.3], 0.5, 0.5)) return FIXED.nostril;
  for (const [n, pts] of legs) if (n === "FN" || n === "HN") {
    const c = legColor(l, n, pts);
    if (c) return c;
  }
  const ear = pose.earBack ? ([23.6, 3.2] as Pt) : ([24.9, 2.2] as Pt);
  if (inCapsule(h, [24.3, 4.8], ear, 0.75)) return COAT.base;
  if (inCapsule(h, [23.6, 4.4], [24.7, 6], 0.7)) return COAT.mane; // chỏm bờm trán
  const headPoly: Pt[] = [[22.8, 5.2], [25.5, 3.8], [28, 5], [30.6, 8.3], [30.6, 10.3], [28.6, 11.2], [24.6, 9.4]];
  if (inPolygon(h, headPoly)) return inEllipse(h, [29.6, 9.8], 1.5, 1.3) ? COAT.shade : h[1] < 5.6 ? COAT.hi : COAT.base;
  if (inCapsule(h, [19.2, 12.4], [22.9, 6.1], 1.05)) return Math.floor(h[1]) % 2 ? COAT.mane : COAT.maneHi; // bờm
  const neck: Pt[] = [[18.4, 13.2], [22.4, 6.6], [25.6, 7.6], [23.6, 13], [22.2, 17.6]];
  if (inPolygon(h, neck)) return h[0] > 23.4 && h[1] > 9.5 ? COAT.shade : COAT.base;
  if (inEllipse(l, [20.8, 16.2], 3, 3.6) || inEllipse(l, [8.3, 15.2], 3.6, 4) || inEllipse(l, BODY_C, 8.3, 3.9)) return bodyShade(l);
  const s = pose.tail ?? 0;
  if (inCapsule(l, [6.6, 13.2], [4.6 + s * 0.3, 16.6], 1.35) || inCapsule(l, [4.6 + s * 0.3, 16.6], [3.6 + s, 22.6], 1.1))
    return l[1] > 19 ? COAT.maneHi : COAT.mane;
  for (const [n, pts] of legs) if (n === "FF" || n === "HF") {
    const c = legColor(l, n, pts);
    if (c) return c;
  }
  return null;
}

// ------------------------------------------------------------------ Yên + nài (S14), gắn theo thân ngựa

function riderAt(p: Pt, pose: Pose, rider: Rider | null): RGBA | null {
  const l = bodyInv(p, pose);
  if (rider) {
    const r = rider;
    if (inEllipse(l, [r.head[0] + 1, r.head[1] + 0.9], 0.8, 0.7)) return RIDER.skin; // mặt
    if (inEllipse(l, r.head, 1.6, 1.5) || inCapsule(l, [r.head[0] + 1.2, r.head[1] - 0.8], [r.head[0] + 2, r.head[1] - 0.4], 0.4))
      return SILK.helmet;
    if (inEllipse(l, r.hand, 0.6, 0.6)) return RIDER.skin;
    if (inCapsule(l, r.shoulder, r.hand, 0.8)) return SILK.secondary; // tay áo
    if (inCapsule(l, r.hip, r.shoulder, 1.6)) {
      const t = segT(l, r.hip, r.shoulder);
      return t > 0.42 && t < 0.62 ? SILK.secondary : SILK.primary; // áo đua có sọc
    }
    if (inCapsule(l, r.knee, r.ankle, 1.0)) return RIDER.boots;
    if (inCapsule(l, r.hip, r.knee, 1.3)) return RIDER.pants;
    if (inCapsule(l, r.hand, mouth(pose), 0.5)) return RIDER.reins;
  }
  if (inPolygon(l, [[12, 11.8], [16.8, 11.8], [17.6, 13.2], [11.4, 13.2]])) return l[1] < 12.4 ? RIDER.saddleHi : RIDER.saddle;
  if (inPolygon(l, [[11, 13.2], [17.6, 13.2], [17.2, 16.2], [11.4, 16.2]])) return l[1] > 15.4 ? SILK.secondary : SILK.primary; // khăn yên
  if (inCapsule(l, [15.2, 16.2], [15.6, 19.4], 0.5)) return RIDER.girth; // đai bụng
  return null;
}

// ------------------------------------------------------------------ Dựng khung

function render(pose: Pose, layer: "horse" | "rider" | "both", rider: Rider | null = null): Img {
  const img = new Img(32, 32);
  if (layer !== "rider") {
    for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) if (inEllipse([x + 0.5, y + 0.5], [15, 30.6], 8.6, 1.1)) img.set(x, y, FIXED.shadow);
    for (let y = 0; y < 32; y++)
      for (let x = 0; x < 32; x++) {
        const c = horseAt([x + 0.5, y + 0.5], pose, [x, y]);
        if (c) img.set(x, y, c);
      }
    outline(img, FIXED.outline, (c) => c[3] < 255);
  }
  if (layer !== "horse") {
    const ov = new Img(32, 32);
    for (let y = 0; y < 32; y++)
      for (let x = 0; x < 32; x++) {
        const c = riderAt([x + 0.5, y + 0.5], pose, rider);
        if (c) ov.set(x, y, c);
      }
    outline(ov, FIXED.outline);
    img.blit(ov, 0, 0);
  }
  return img;
}

// ------------------------------------------------------------------ Dáng đi

/** Chu kỳ một chân: trụ đất (stance) chân quét từ +A về −A; bước (swing) quay lại +A và gập lên. */
function gait(phase: number, stance: number, A: number, B: number): Leg {
  const p = ((phase % 1) + 1) % 1;
  if (p < stance) return [A - (2 * A * p) / stance, 0];
  const u = (p - stance) / (1 - stance);
  return [-A + 2 * A * u, Math.sin(Math.PI * u) * B];
}

function cycle(k: number, offsets: Record<LegName, number>, stance: number, A: number, B: number, extra: (phase: number, airborne: boolean) => Omit<Pose, "legs">): Pose {
  const ph = k / 6;
  const legs = Object.fromEntries((Object.keys(offsets) as LegName[]).map((n) => [n, gait(ph + offsets[n], stance, A, B)])) as Record<LegName, Leg>;
  const airborne = (Object.keys(offsets) as LegName[]).every((n) => ((ph + offsets[n]) % 1) >= stance);
  return { legs, ...extra(ph, airborne) };
}

const STAND: Record<LegName, Leg> = { FN: [2, 0], FF: [6, 0], HN: [-4, -4], HF: [2, -2] };

const idle = (k: number): Pose => ({
  legs: STAND,
  tail: Math.sin((k / 6) * Math.PI * 2) * 1.3,
  head: { dy: [0, 0, 0.5, 1, 0.5, 0][k] },
  earBack: k === 4,
});

const walk = (k: number) =>
  cycle(k, { HN: 0, FN: 0.25, HF: 0.5, FF: 0.75 }, 0.62, 16, 48, (ph) => ({
    body: { dy: Math.abs(Math.sin(ph * Math.PI * 2)) * 0.4 },
    head: { dy: Math.sin(ph * Math.PI * 4) * 0.6 },
    tail: Math.sin(ph * Math.PI * 2) * 0.8,
  }));

const trot = (k: number) =>
  cycle(k, { FN: 0, HF: 0, FF: 0.5, HN: 0.5 }, 0.45, 22, 72, (ph, air) => ({
    body: { dy: air ? -1 : 0 },
    head: { dy: air ? -0.4 : 0.4, rot: 4 },
    tail: -1 + Math.sin(ph * Math.PI * 4) * 0.6,
  }));

// Phi nước đại — 6 khung đặt tay theo đề bài S01-H4 (góc đoạn trên, độ gập; gập dương = móng hất ra sau):
// K1 sau-trái chạm đất · K2 sau-phải + trước-trái · K3 trước-phải chạm đất · K4 bay (4 chân co dưới bụng)
// K5 duỗi dài · K6 chuẩn bị tiếp đất.
const GALLOP: Pose[] = [
  { legs: { HN: [22, 6], HF: [-18, 40], FN: [-28, 36], FF: [12, 70] }, body: { dy: 0.5, rot: 3 }, head: { rot: 16, dy: 0.6 }, tail: -2 },
  { legs: { HN: [-4, 2], HF: [20, 4], FN: [26, 2], FF: [-22, 46] }, body: { dy: 0.7, rot: 1 }, head: { rot: 12, dy: 0.8 }, tail: -2.4 },
  { legs: { HN: [-30, 14], HF: [-14, 6], FN: [6, 0], FF: [34, 30] }, body: { dy: 0.3, rot: -2 }, head: { rot: 8, dy: 0.4 }, tail: -2.8 },
  { legs: { HN: [34, 96], HF: [26, 100], FN: [-26, 92], FF: [-18, 98] }, body: { dy: -1.6, rot: 0 }, head: { rot: 10 }, tail: -3 },
  { legs: { HN: [-52, -6], HF: [-44, -2], FN: [56, -12], FF: [48, -8] }, body: { dy: -1.2, rot: 1 }, head: { rot: 20, dy: 0.6 }, tail: -3.2 },
  { legs: { HN: [30, 34], HF: [16, 46], FN: [34, 12], FF: [18, 34] }, body: { dy: -0.4, rot: 4 }, head: { rot: 18, dy: 0.6 }, tail: -2.6 },
];
const gallop = (k: number) => GALLOP[k];

const graze = (k: number): Pose => ({
  legs: { FN: [8, 0], FF: [12, 0], HN: [-6, -4], HF: [0, -2] },
  body: { rot: 5, pivot: JOINT.HN },
  head: { rot: 98, dy: 1.6 + (k === 1 ? 0.6 : 0), dx: -0.4 },
  tail: [0.5, 1, 0.2][k],
});

const lie = (k: number): Pose => ({
  legs: { FN: [82, 150], FF: [76, 140], HN: [74, 140], HF: [70, 135] },
  body: { dy: 8.4 + (k === 1 ? 0.3 : 0) },
  head: { rot: -6, dy: k === 2 ? 0.5 : 0 },
  tail: 2.4,
});

const SPECIAL: Pose[] = [
  { legs: { FN: [28, -6], FF: [24, -4], HN: [18, 6], HF: [14, 8] }, body: { rot: -6, pivot: JOINT.HN }, head: { rot: -8 }, tail: 2 }, // dừng khựng 1
  { legs: { FN: [32, -8], FF: [28, -6], HN: [22, 8], HF: [18, 10] }, body: { rot: -9, pivot: JOINT.HN }, head: { rot: -12 }, tail: 2.6 }, // dừng khựng 2
  { legs: { FN: [10, 74], FF: [4, 0], HN: [-4, -4], HF: [2, -2] }, head: { rot: 16, dy: 1 }, alert: true, tail: 0.6 }, // khập khiễng 1
  { legs: { FN: [14, 84], FF: [6, 0], HN: [-6, -4], HF: [0, -2] }, head: { rot: 20, dy: 1.6 }, alert: true, tail: 0.2 }, // khập khiễng 2
  { legs: { FN: [16, 0], FF: [10, 0], HN: [-16, 0], HF: [-10, 0] }, body: { dy: -0.5, rot: -4 }, head: { rot: -14 }, tail: -2.2 }, // giật mình
  { legs: { FN: [64, 104], FF: [56, 96], HN: [30, 2], HF: [24, 4] }, body: { rot: -28, pivot: JOINT.HN, dx: -1.5, dy: 0.3 }, head: { rot: -4 }, tail: 3 }, // chồm lên
];

// ------------------------------------------------------------------ Tư thế nài theo dáng

function jockeyGallop(pose: Pose): Rider {
  const jy = -(pose.body?.dy ?? 0) * 0.7; // nài giữ đầu tương đối đứng yên khi ngựa nhún
  const o = (p: Pt): Pt => [p[0], p[1] + jy];
  return { hip: o([14.6, 10.4]), knee: o([17.6, 11.6]), ankle: o([15.9, 14.6]), shoulder: o([19.6, 7.6]), head: o([21.4, 6]), hand: o([23.2, 10.3]) };
}

function jockeyTrot(k: number): Rider {
  const up = k % 3 === 0 ? -0.8 : 0; // nhún yên theo nhịp kiệu
  const o = (p: Pt): Pt => [p[0], p[1] + up];
  return { hip: o([14.4, 9.8]), knee: o([16.8, 12]), ankle: [15.6, 15.2], shoulder: o([17.6, 5]), head: o([18.6, 3.3]), hand: o([21.8, 9.4]) };
}

const JOCKEY_SIT: Rider = { hip: [14, 10.6], knee: [16.4, 12.6], ankle: [15, 16.2], shoulder: [15.2, 5.2], head: [15.6, 3.4], hand: [18.8, 10.2] };

// ------------------------------------------------------------------ Xuất

const range = (n: number) => Array.from({ length: n }, (_, i) => i);

const s01 = sheet([
  range(6).map((k) => render(idle(k), "horse")),
  range(6).map((k) => render(walk(k), "horse")),
  range(6).map((k) => render(trot(k), "horse")),
  range(6).map((k) => render(gallop(k), "horse")),
  [...range(3).map((k) => render(graze(k), "horse")), ...range(3).map((k) => render(lie(k), "horse"))],
  SPECIAL.map((p) => render(p, "horse")),
]);

const s14 = sheet([
  range(6).map((k) => render(gallop(k), "rider", jockeyGallop(gallop(k)))),
  range(6).map((k) => render(trot(k), "rider", jockeyTrot(k))),
  range(6).map((k) => render(idle(k), "rider", JOCKEY_SIT)),
  range(6).map((k) => render(gallop(k), "rider", null)),
  range(6).map((k) => render(gallop(k), "both", jockeyGallop(gallop(k)))),
]);

// Tự kiểm: sheet đúng 192×192; điểm ảnh ngựa chỉ dùng màu trong bảng cho phép (để palette swap không sót).
assert.equal(s01.w, 192);
assert.equal(s01.h, 192);
const allowed = new Set([...Object.values(COAT), ...Object.values(FIXED)].map((c) => c.join(",")));
for (let y = 0; y < s01.h; y++)
  for (let x = 0; x < s01.w; x++) {
    const c = s01.get(x, y);
    if (c[3] > 0) assert.ok(allowed.has(c.join(",")), `màu lạ ${c} tại ${x},${y}`);
  }

const root = new URL("../..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
savePng(`${root}art/png/s01-horse.png`, s01);
savePng(`${root}art/png/s14-rider.png`, s14);
savePng(`${root}art/preview/s01-horse-x4.png`, preview(s01, 4));
savePng(`${root}art/preview/s14-rider-x4.png`, preview(s14, 4));
mkdirSync(`${root}public/assets/sprites`, { recursive: true });
copyFileSync(`${root}art/png/s01-horse.png`, `${root}public/assets/sprites/s01-horse.png`);
copyFileSync(`${root}art/png/s14-rider.png`, `${root}public/assets/sprites/s14-rider.png`);
// Xem trước palette swap theo bảng quy đổi SRS §12-A (Bay → Chestnut / Black / Gray): thay đúng 8 mã hex.
const SWAP: Record<string, string[]> = {
  CHESTNUT: ["#E28743", "#B2531B", "#7E3108", "#F0A15E", "#ECC082", "#B07C3D", "#8A3D16", "#5C280C"],
  BLACK: ["#38383F", "#24242A", "#121216", "#4E4E57", "#47474E", "#1D1D21", "#323238", "#17171C"],
  GRAY: ["#ECECEC", "#CDCDCD", "#9B9B9B", "#FFFFFF", "#A8A8A8", "#737373", "#8E8E8E", "#5A5A5A"],
};
const ORDER = [COAT.hi, COAT.base, COAT.shade, COAT.spec, COAT.maneHi, COAT.mane, COAT.legHi, COAT.leg].map((c) => c.join(","));
function swapped(src: Img, to: string[]): Img {
  const out = new Img(src.w, src.h);
  for (let y = 0; y < src.h; y++)
    for (let x = 0; x < src.w; x++) {
      const c = src.get(x, y);
      const i = ORDER.indexOf(c.join(","));
      out.set(x, y, i >= 0 ? hex(to[i]) : c);
    }
  return out;
}
// Hàng 1: Bay gốc (đứng yên) · hàng 2–4: Chestnut / Black / Gray
const coats = new Img(192, 32 * 4);
[null, ...Object.values(SWAP)].forEach((to, i) => {
  const src = to ? swapped(s01, to) : s01;
  for (let y = 0; y < 32; y++) for (let x = 0; x < 192; x++) coats.set(x, 32 * i + y, src.get(x, y));
});
savePng(`${root}art/preview/s01-coats-x4.png`, preview(coats, 4));
console.log("OK s01-horse.png, s14-rider.png (192×192)");
