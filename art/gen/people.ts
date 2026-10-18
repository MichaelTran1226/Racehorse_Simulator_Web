// Đợt 3 — vẽ lại S06 (6 nhân vật: đi bộ 4 · đứng 1 · hành động 1) và S15 (xe chở ngựa & phương tiện).
// Chạy: node art/gen/people.ts → art/png/s06-people.png, s15-vehicles.png + preview.
import assert from "node:assert/strict";
import { copyFileSync } from "node:fs";
import { hex, Img, inCapsule, inEllipse, limb, outline, preview, rot, savePng, sheet, type Pt, type RGBA } from "./pixel.ts";

const INK = hex("#1D130E");
const SHADOW = hex("#000000", 60);
const SKIN = hex("#E8B48A");
const SKIN_SHADE = hex("#C98F66");
const EYE = hex("#2A1A12");

// ------------------------------------------------------------------ Nhân vật nhìn ngang, quay phải, chân ở y = 30

interface Outfit {
  hair: RGBA;
  torso: RGBA;
  torsoShade: RGBA;
  pants: RGBA;
  pantsShade: RGBA;
  shoes: RGBA;
  sleeve?: RGBA;
  /** áo khoác dài phủ đùi (blouse VET) */
  coat?: boolean;
  /** yếm (groom): áo trong + yếm màu */
  bib?: RGBA;
  hat?: "cap" | "wide" | "helmet";
  hatColor?: RGBA;
  stripe?: RGBA; // sọc áo đua
  boots?: RGBA; // bốt cao tới gối
  tie?: RGBA;
}

type Limb = readonly [number, number]; // [góc đoạn trên, độ gập] (độ, dương = về trước)

interface Pose {
  legN: Limb;
  legF: Limb;
  armN: Limb;
  armF: Limb;
  dy?: number;
  tilt?: number; // nghiêng người về trước (độ)
}

type Prop = (l: Pt, p: { handN: Pt; handF: Pt; shoulder: Pt; head: Pt }) => RGBA | null;

const HIP: Pt = [15.5, 19.5];
const THIGH = 5.2;
const SHIN = 5.4;
const UPPER = 4;
const FORE = 3.8;

function person(o: Outfit, pose: Pose, prop: Prop | null): Img {
  const g = new Img(32, 32);
  for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) if (inEllipse([x + 0.5, y + 0.5], [16, 30.6], 5.5, 1)) g.set(x, y, SHADOW);
  const dy = pose.dy ?? 0;
  const hip: Pt = [HIP[0], HIP[1] + dy];
  const tilt = pose.tilt ?? 0;
  const shoulder = rot([hip[0], hip[1] - 7.5], hip, (tilt * Math.PI) / 180);
  const head: Pt = [shoulder[0] + 0.4 + tilt * 0.04, shoulder[1] - 4.4];
  const leg = (lg: Limb): [Pt, Pt, Pt] => {
    const knee = limb(hip, lg[0], THIGH);
    return [hip, knee, limb(knee, lg[0] - lg[1], SHIN)];
  };
  const arm = (a: Limb): [Pt, Pt, Pt] => {
    const s: Pt = [shoulder[0], shoulder[1] + 1];
    const elbow = limb(s, a[0], UPPER);
    return [s, elbow, limb(elbow, a[0] + a[1], FORE)];
  };
  const LN = leg(pose.legN);
  const LF = leg(pose.legF);
  const AN = arm(pose.armN);
  const AF = arm(pose.armF);
  const ctx = { handN: AN[2], handF: AF[2], shoulder, head };

  const legColor = (l: Pt, pts: [Pt, Pt, Pt], far: boolean): RGBA | null => {
    const [h, k, f] = pts;
    if (inCapsule(l, f, [f[0] + 1.6, f[1]], 0.95)) return o.shoes;
    if (inCapsule(l, k, f, 1.05)) return o.boots ?? (far ? o.pantsShade : o.pants);
    if (inCapsule(l, h, k, 1.35)) return far ? o.pantsShade : o.pants;
    return null;
  };
  const armColor = (l: Pt, pts: [Pt, Pt, Pt], far: boolean): RGBA | null => {
    const [s, e, h] = pts;
    if (inEllipse(l, h, 1, 1)) return far ? SKIN_SHADE : SKIN;
    if (inCapsule(l, s, e, 1.1) || inCapsule(l, e, h, 1)) return far ? o.torsoShade : (o.sleeve ?? o.torso);
    return null;
  };

  for (let y = 0; y < 32; y++)
    for (let x = 0; x < 32; x++) {
      const l: Pt = [x + 0.5, y + 0.5];
      let c: RGBA | null = prop ? prop(l, ctx) : null;
      // mũ
      if (!c && o.hat === "wide" && (inCapsule(l, [head[0] - 4.6, head[1] - 2], [head[0] + 4.8, head[1] - 2], 0.7) || inEllipse(l, [head[0], head[1] - 3.4], 2.8, 1.8)))
        c = o.hatColor ?? o.hair;
      if (!c && o.hat === "cap" && (inEllipse(l, [head[0], head[1] - 1.8], 3.2, 1.8) || inCapsule(l, [head[0] + 1.5, head[1] - 1.4], [head[0] + 4.2, head[1] - 1], 0.6)))
        c = o.hatColor ?? o.hair;
      if (!c && o.hat === "helmet" && (inEllipse(l, [head[0], head[1] - 1], 3.4, 2.8) || inCapsule(l, [head[0] + 2, head[1] - 1.6], [head[0] + 4, head[1] - 1.2], 0.5)))
        c = l[1] < head[1] - 0.5 || l[0] > head[0] + 2 ? (o.hatColor ?? o.hair) : null;
      if (!c && inEllipse(l, [head[0] + 2, head[1] + 0.2], 0.55, 0.55)) c = EYE;
      if (!c && inEllipse(l, head, 3.1, 3.2)) c = l[1] < head[1] - 1 || l[0] < head[0] - 1.6 ? o.hair : SKIN;
      if (!c) c = armColor(l, AN, false);
      if (!c && o.tie && inCapsule(l, [shoulder[0] + 1.3, shoulder[1] + 1], [shoulder[0] + 1.6, shoulder[1] + 4.2], 0.55)) c = o.tie;
      if (!c && inCapsule(l, hip, shoulder, 2.9)) {
        c = l[0] < hip[0] - 1.3 ? o.torsoShade : o.torso;
        if (o.bib && l[1] > shoulder[1] + 1.2) c = o.bib;
        if (o.stripe && Math.abs(l[1] - (shoulder[1] + 3.2)) < 0.8) c = o.stripe;
      }
      if (!c && o.coat && inCapsule(l, hip, [hip[0] - 0.3, hip[1] + 4.6], 2.7)) c = l[0] < hip[0] - 1 ? o.torsoShade : o.torso;
      if (!c) c = legColor(l, LN, false);
      if (!c) c = armColor(l, AF, true);
      if (!c) c = legColor(l, LF, true);
      if (c) g.set(x, y, c);
    }
  outline(g, INK, (c) => c[3] < 255);
  return g;
}

// Chu kỳ đi bộ 4 khung (tiếp đất · lướt qua · tiếp đất · lướt qua), tay đánh ngược chân.
const WALK: Pose[] = [
  { legN: [22, 0], legF: [-22, 12], armN: [-20, 10], armF: [20, 20] },
  { legN: [4, 0], legF: [-6, 44], armN: [-4, 14], armF: [4, 14], dy: -0.8 },
  { legN: [-22, 12], legF: [22, 0], armN: [20, 20], armF: [-20, 10] },
  { legN: [-6, 44], legF: [4, 0], armN: [4, 14], armF: [-4, 14], dy: -0.8 },
];
const STAND: Pose = { legN: [3, 0], legF: [-3, 0], armN: [4, 6], armF: [-4, 6] };

const hold = (pose: Pose, armN: Limb): Pose => ({ ...pose, armN });

// ------------------------------------------------------------------ Đạo cụ

const rect = (l: Pt, x: number, y: number, w: number, h: number) => l[0] >= x && l[0] < x + w && l[1] >= y && l[1] < y + h;
const TABLET = hex("#3A4250");
const SCREEN = hex("#8FD4FF");
const WATCH = hex("#C9CED3");
const BAG = hex("#7A2E2E");
const STETH = hex("#4A4E52");
const BUCKET = hex("#8A8F93");
const WATER = hex("#3F8FCF");
const BRUSH = hex("#9C6A3F");
const WHIP = hex("#2B1A10");

const tabletProp = (raised: boolean): Prop => (l, p) => {
  const h = raised ? p.handN : p.handF;
  if (rect(l, h[0] - 0.5, h[1] - 3.5, 3.5, 4.5)) return rect(l, h[0], h[1] - 3, 2.5, 3.5) ? SCREEN : TABLET;
  if (raised && inCapsule(l, p.handF, [p.handF[0] + 1.5, p.handF[1] - 2.5], 0.45)) return STETH; // bút ký
  return null;
};
const watchProp: Prop = (l, p) => (inEllipse(l, [p.handN[0] + 0.6, p.handN[1] - 1], 1.2, 1.2) ? WATCH : null);
const bagProp: Prop = (l, p) => (rect(l, p.handN[0] - 2, p.handN[1] + 0.5, 4.5, 3.5) ? BAG : rect(l, p.handN[0] - 0.6, p.handN[1] - 0.2, 1.2, 1) ? INK : null);
const stethProp: Prop = (l, p) =>
  inCapsule(l, [p.shoulder[0] + 1, p.shoulder[1] + 0.5], p.handN, 0.45) || inEllipse(l, p.handN, 1.1, 1.1) ? STETH : null;
const bucketProp: Prop = (l, p) => {
  const h = p.handN;
  if (rect(l, h[0] - 2, h[1] + 1.5, 4.5, 4)) return l[1] < h[1] + 2.5 ? WATER : BUCKET;
  if (inCapsule(l, [h[0] - 2, h[1] + 1.5], [h[0] + 2.4, h[1] + 1.5], 0.3) || inCapsule(l, h, [h[0], h[1] + 1.4], 0.3)) return STETH;
  return null;
};
const brushProp: Prop = (l, p) => (rect(l, p.handN[0] - 0.5, p.handN[1] - 1.2, 3.5, 2) ? BRUSH : rect(l, p.handN[0] - 0.5, p.handN[1] + 0.8, 3.5, 0.9) ? INK : null);
const whipProp = (up: boolean): Prop => (l, p) =>
  inCapsule(l, p.handN, up ? [p.handN[0] + 2, p.handN[1] - 6] : [p.handN[0] + 4, p.handN[1] + 2], 0.45) ? WHIP : null;

// ------------------------------------------------------------------ 6 vai

const ROLES: { outfit: Outfit; walkProp: Prop | null; standProp: Prop | null; action: Pose; actionProp: Prop | null }[] = [
  {
    // H1 Quản lý CLB: vest xanh đậm, sơ mi trắng, cà vạt — hành động: ký duyệt trên tablet
    outfit: { hair: hex("#3B2A20"), torso: hex("#2B3A55"), torsoShade: hex("#1F2A40"), pants: hex("#2B3A55"), pantsShade: hex("#1F2A40"), shoes: INK, tie: hex("#B03A2E") },
    walkProp: tabletProp(false),
    standProp: tabletProp(false),
    action: { ...STAND, armN: [70, 70], armF: [50, 80] },
    actionProp: tabletProp(true),
  },
  {
    // H2 HLV trưởng: áo khoác đỏ, mũ lưỡi trai — hành động: giơ đồng hồ bấm giờ
    outfit: { hair: hex("#6B4226"), torso: hex("#C62828"), torsoShade: hex("#8E1C1C"), pants: hex("#3E3E46"), pantsShade: hex("#2C2C33"), shoes: INK, hat: "cap", hatColor: hex("#C62828") },
    walkProp: watchProp,
    standProp: watchProp,
    action: { ...STAND, armN: [150, 20] },
    actionProp: watchProp,
  },
  {
    // H3 Bác sĩ thú y: blouse trắng dài, ống nghe, túi y tế — hành động: khom người nghe tim
    outfit: { hair: hex("#2A1F1A"), torso: hex("#F2F2F2"), torsoShade: hex("#CFCFCF"), pants: hex("#5C7A99"), pantsShade: hex("#456079"), shoes: INK, coat: true },
    walkProp: bagProp,
    standProp: bagProp,
    action: { legN: [14, 10], legF: [-8, 6], armN: [70, 20], armF: [40, 30], tilt: 22, dy: 0.8 },
    actionProp: stethProp,
  },
  {
    // H4 Groom: áo vải sáng + yếm xanh, ủng nâu — hành động: chải lông
    outfit: { hair: hex("#4A3426"), torso: hex("#E8DCC0"), torsoShade: hex("#C9BC9E"), bib: hex("#2F6DB5"), pants: hex("#2F6DB5"), pantsShade: hex("#24528A"), shoes: hex("#4E2F1A"), boots: hex("#4E2F1A") },
    walkProp: bucketProp,
    standProp: bucketProp,
    action: { ...STAND, armN: [85, 5], armF: [60, 30] },
    actionProp: brushProp,
  },
  {
    // H5 Chủ ngựa: vest xám, mũ rộng vành — hành động: vỗ tay
    outfit: { hair: hex("#9E9E9E"), torso: hex("#6B6E73"), torsoShade: hex("#4E5156"), pants: hex("#4E5156"), pantsShade: hex("#3A3C40"), shoes: INK, hat: "wide", hatColor: hex("#7A4E2D"), tie: hex("#2F6DB5") },
    walkProp: null,
    standProp: null,
    action: { ...STAND, armN: [45, 95], armF: [35, 105] },
    actionProp: null,
  },
  {
    // H6 Nài đi bộ: áo đua theo quy tắc B (đỏ #D32F2F · sọc trắng · mũ đỏ), quần trắng, bốt đen — hành động: giơ roi chào
    outfit: { hair: hex("#3B2A20"), torso: hex("#D32F2F"), torsoShade: hex("#A82424"), stripe: hex("#FFFFFF"), sleeve: hex("#FFFFFF"), pants: hex("#F2F2F2"), pantsShade: hex("#CFCFCF"), shoes: hex("#0D0D0D"), boots: hex("#0D0D0D"), hat: "helmet", hatColor: hex("#D32F2F") },
    walkProp: whipProp(false),
    standProp: whipProp(false),
    action: { ...STAND, armN: [165, 10] },
    actionProp: whipProp(true),
  },
];

const s06 = sheet(
  ROLES.map((r) => [
    ...WALK.map((p) => person(r.outfit, r.walkProp === bucketProp || r.walkProp === bagProp ? hold(p, [6, 4]) : p, r.walkProp)),
    person(r.outfit, r.standProp === bucketProp || r.standProp === bagProp ? hold(STAND, [4, 2]) : STAND, r.standProp),
    person(r.outfit, r.action, r.actionProp),
  ]),
);

// ------------------------------------------------------------------ S15 — Xe (vẽ trên các khối nhiều ô)

const V = {
  body: hex("#B9BFC6"),
  bodyShade: hex("#8A9199"),
  bodyLight: hex("#DDE2E7"),
  rib: hex("#6E757D"),
  glass: hex("#9FD3EA"),
  glassDark: hex("#5FA7C9"),
  tire: hex("#2A2A2E"),
  rim: hex("#9EA4AA"),
  chassis: hex("#3A3D42"),
  light: hex("#FFE082"),
  red: hex("#D93838"),
  wood: hex("#7A4E2D"),
  woodDark: hex("#4E2F1A"),
  woodLight: hex("#9C6A3F"),
  straw: hex("#D9B44A"),
  strawDark: hex("#B8902F"),
  strawLight: hex("#EBCF73"),
  tray: hex("#B03A2E"),
  trayDark: hex("#8A2A20"),
  white: hex("#F2F2F2"),
  whiteShade: hex("#CFCFCF"),
  seat: hex("#2B3A55"),
  horse: hex("#8B3C1B"),
  horseDark: hex("#5A2510"),
  ramp: hex("#5B6168"),
};

const R = (g: Img, x: number, y: number, w: number, h: number, c: RGBA) => {
  for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) g.set(i, j, c);
};
const E = (g: Img, cx: number, cy: number, rx: number, ry: number, c: RGBA) => {
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++)
    for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) if (inEllipse([x + 0.5, y + 0.5], [cx, cy], rx, ry)) g.set(x, y, c);
};

function wheel(g: Img, cx: number, cy: number, r: number, spin = 0) {
  E(g, cx, cy, r, r, V.tire);
  E(g, cx, cy, r * 0.55, r * 0.55, V.rim);
  // nan hoa vẽ thành đường để 4 khung lăn khác nhau rõ ràng
  for (let k = 0; k < 4; k++) {
    const a = spin + (k * Math.PI) / 2;
    for (let t = 0; t <= r * 0.55; t += 0.5) g.set(Math.round(cx - 0.5 + Math.cos(a) * t), Math.round(cy - 0.5 + Math.sin(a) * t), V.chassis);
  }
  if (r > 6) {
    // vết ta-lông trên lốp to (bánh lăn) cũng xoay theo
    for (let k = 0; k < 8; k++) {
      const a = spin + (k * Math.PI) / 4;
      g.set(Math.round(cx - 0.5 + Math.cos(a) * (r - 1)), Math.round(cy - 0.5 + Math.sin(a) * (r - 1)), V.rib);
    }
  }
}

/** Xe tải + thùng chở ngựa nhìn ngang, rộng 128 px (4 ô). open = cửa sau hạ thành cầu dắt. */
function truck(open: boolean): Img {
  const g = new Img(128, 32);
  E(g, 64, 30.5, 56, 1.3, SHADOW);
  // thùng kéo x 22–94
  R(g, 22, 3, 72, 21, V.body);
  R(g, 22, 3, 72, 2, V.bodyLight);
  R(g, 22, 21, 72, 3, V.bodyShade);
  for (let x = 30; x < 94; x += 9) R(g, x, 5, 1, 16, V.rib);
  R(g, 34, 7, 18, 5, V.glassDark); // cửa sổ thông gió
  R(g, 58, 7, 18, 5, V.glassDark);
  R(g, 22, 24, 72, 2, V.chassis);
  if (open) {
    R(g, 22, 4, 4, 20, V.chassis); // khoang tối + ngựa
    R(g, 26, 8, 8, 14, hex("#1E2126"));
    E(g, 30, 13, 3, 2.5, V.horse);
    R(g, 28, 15, 5, 6, V.horseDark);
    for (let i = 0; i < 20; i++) R(g, 21 - i, 24 + Math.round(i * 0.3), 2, 2, V.ramp); // cầu dắt
  } else {
    R(g, 22, 3, 3, 21, V.bodyShade);
    R(g, 23, 12, 1, 3, V.chassis);
  }
  wheel(g, 50, 26, 4.5);
  wheel(g, 62, 26, 4.5);
  // thanh kéo + đầu xe x 94–126
  R(g, 94, 21, 6, 2, V.chassis);
  R(g, 100, 9, 25, 15, V.white);
  R(g, 100, 9, 25, 2, hex("#FFFFFF"));
  R(g, 100, 21, 25, 3, V.whiteShade);
  R(g, 106, 3, 14, 7, V.white);
  R(g, 108, 4, 11, 5, V.glass);
  R(g, 108, 4, 11, 1, V.glassDark);
  R(g, 121, 11, 3, 5, V.glass);
  R(g, 124, 18, 2, 3, V.light);
  R(g, 100, 24, 26, 2, V.chassis);
  R(g, 112, 14, 3, 1, V.chassis); // tay nắm cửa
  wheel(g, 106, 26, 4.5);
  wheel(g, 120, 26, 4.5);
  outline(g, INK, (c) => c[3] < 255);
  return g;
}

function cell(w: number, draw: (g: Img) => void): Img {
  const g = new Img(w, 32);
  draw(g);
  outline(g, INK, (c) => c[3] < 255);
  return g;
}

const wheelFrames = [0, 1, 2, 3].map((k) => cell(32, (g) => wheel(g, 16, 16, 9, (k * Math.PI) / 8)));

const trailerTop = cell(96, (g) => {
  R(g, 4, 6, 88, 20, V.body);
  R(g, 4, 6, 88, 2, V.bodyLight);
  R(g, 4, 24, 88, 2, V.bodyShade);
  for (let x = 14; x < 92; x += 14) R(g, x, 8, 1, 16, V.rib);
  R(g, 0, 14, 4, 4, V.chassis); // móc kéo
  R(g, 46, 12, 20, 8, V.bodyShade); // nắp thông gió
});

function barrow(load: boolean) {
  return cell(32, (g) => {
    E(g, 16, 29.5, 11, 1.2, SHADOW);
    for (let i = 0; i < 12; i++) g.set(3 + i, 17 + Math.round(i * 0.15), V.woodDark); // tay cầm
    R(g, 10, 13, 16, 7, V.tray);
    R(g, 10, 13, 16, 2, V.trayDark);
    R(g, 12, 20, 12, 2, V.trayDark);
    if (load) {
      E(g, 18, 12, 8, 4, V.straw);
      E(g, 16, 11, 4, 2, V.strawLight);
    }
    wheel(g, 25, 25, 4);
    R(g, 12, 22, 2, 7, V.woodDark); // chân chống
  });
}

const hayCart = cell(64, (g) => {
  E(g, 30, 30, 26, 1.3, SHADOW);
  R(g, 8, 16, 38, 6, V.woodLight);
  R(g, 8, 16, 38, 1, V.wood);
  R(g, 8, 22, 38, 2, V.woodDark);
  E(g, 27, 11, 18, 7, V.straw);
  for (let i = 0; i < 18; i++) g.set(12 + i * 2, 8 + (i % 3), V.strawDark);
  E(g, 22, 8, 6, 2, V.strawLight);
  for (let i = 0; i < 16; i++) g.set(46 + i, 20 + Math.round(i * 0.25), V.woodDark); // càng kéo
  wheel(g, 27, 24, 6.5);
});

function golfCart(driver: boolean) {
  return cell(64, (g) => {
    E(g, 32, 30, 24, 1.3, SHADOW);
    R(g, 12, 3, 38, 3, V.white); // mái che
    R(g, 14, 6, 2, 12, V.rib);
    R(g, 46, 6, 2, 12, V.rib);
    R(g, 10, 16, 44, 8, V.white);
    R(g, 10, 22, 44, 2, V.whiteShade);
    R(g, 46, 12, 8, 6, V.white);
    R(g, 52, 14, 2, 3, V.light);
    R(g, 18, 12, 14, 4, V.seat); // ghế
    R(g, 10, 12, 8, 4, V.wood); // thùng chở đồ phía sau
    if (driver) {
      E(g, 30, 7.5, 2.6, 2.6, SKIN);
      R(g, 28, 5, 5, 2, hex("#2E9D4A")); // mũ
      R(g, 27, 10, 6, 5, hex("#2E9D4A"));
      R(g, 33, 11, 6, 2, SKIN);
      R(g, 38, 10, 2, 4, V.chassis); // vô lăng
    }
    wheel(g, 18, 25, 4.5);
    wheel(g, 46, 25, 4.5);
  });
}

// Ghép S15: H1 xe đóng (4 ô) · H2 xe mở cầu dắt (4 ô) · H3 bánh lăn 4 khung · H4 thùng nhìn từ trên (3 ô) + xe cút kít rỗng/chở cỏ
// · H5 xe kéo chở cỏ (2 ô) · H6 xe điện trống / có người lái (2 ô mỗi xe).
const s15 = new Img(192, 192);
s15.blit(truck(false), 0, 0);
s15.blit(truck(true), 0, 32);
wheelFrames.forEach((w, i) => s15.blit(w, i * 32, 64));
s15.blit(trailerTop, 0, 96);
s15.blit(barrow(false), 96, 96);
s15.blit(barrow(true), 128, 96);
s15.blit(hayCart, 0, 128);
s15.blit(golfCart(false), 0, 160);
s15.blit(golfCart(true), 64, 160);

// ------------------------------------------------------------------ Xuất + kiểm

assert.equal(s06.w, 192);
assert.equal(s06.h, 192);
for (let r = 0; r < 6; r++)
  for (let c = 0; c < 6; c++) {
    let n = 0;
    for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) if (s06.alpha(c * 32 + x, r * 32 + y) === 255) n++;
    assert.ok(n > 80, `S06 hàng ${r + 1} cột ${c + 1} trống`);
  }

const root = new URL("../..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
for (const [name, img] of [["s06-people", s06], ["s15-vehicles", s15]] as const) {
  savePng(`${root}art/png/${name}.png`, img);
  savePng(`${root}art/preview/${name}-x4.png`, preview(img, 4));
  copyFileSync(`${root}art/png/${name}.png`, `${root}public/assets/sprites/${name}.png`);
}
console.log("OK s06-people, s15-vehicles (192×192)");
