// Đợt 4 — vẽ lại S13 (hiệu ứng) và S11 (36 biểu tượng nghiệp vụ). Ô 32×32, tấm 6×6, nền trong suốt.
// S13 giữ vị trí hàng mà code đang dùng: H1 bụi · H3 chớp đỏ (cột 3–4) · H5 zzz (cột 3–4) + tim (cột 5–6).
// Chạy: node art/gen/fx-icons.ts → art/png/s13-fx.png, s11-icons.png + preview.
import assert from "node:assert/strict";
import { copyFileSync } from "node:fs";
import { hex, Img, inCapsule, inEllipse, outline, preview, savePng, sheet, type Pt, type RGBA } from "./pixel.ts";

const INK = hex("#1D130E");
const K = {
  dust: hex("#C8A878"),
  dustDark: hex("#A8885A"),
  dustLight: hex("#E2CCA2"),
  sweat: hex("#8CC8F0"),
  sweatDark: hex("#3F8FCF"),
  white: hex("#FFFFFF"),
  hoof: hex("#5A3A22"),
  gold: hex("#E9C21A"),
  goldDark: hex("#B8901A"),
  goldLight: hex("#FFF2A8"),
  red: hex("#D93838"),
  redDark: hex("#A12626"),
  redLight: hex("#FF7A6A"),
  lamp: hex("#FFE9A0"),
  rain: hex("#8CC8F0"),
  rainDark: hex("#5FA7C9"),
  zzzBg: hex("#E8F4FB"),
  zzz: hex("#2C6DA6"),
  heart: hex("#E04858"),
  heartLight: hex("#FF9AA6"),
  green: hex("#2E9D4A"),
  greenLight: hex("#7FD08F"),
  yellow: hex("#F1C40F"),
  purple: hex("#7B3FB0"),
  purpleLight: hex("#B98AE0"),
  blue: hex("#1976D2"),
  blueLight: hex("#6FA8F0"),
  gray: hex("#8A8F93"),
  grayDark: hex("#5E6367"),
  grayLight: hex("#C9CED3"),
  wood: hex("#7A4E2D"),
  woodLight: hex("#9C6A3F"),
  paper: hex("#F3E6C4"),
  paperDark: hex("#D9C08A"),
  orange: hex("#EF7C1A"),
  flame: hex("#FFB13B"),
  ice: hex("#CFF0FF"),
  dark: hex("#2A2A2E"),
  skin: hex("#E8B48A"),
};

type Draw = (g: Img) => void;

const R = (g: Img, x: number, y: number, w: number, h: number, c: RGBA) => {
  for (let j = Math.round(y); j < Math.round(y + h); j++) for (let i = Math.round(x); i < Math.round(x + w); i++) g.set(i, j, c);
};
const P = (g: Img, x: number, y: number, c: RGBA) => g.set(Math.round(x), Math.round(y), c);
const E = (g: Img, cx: number, cy: number, rx: number, ry: number, c: RGBA) => {
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++)
    for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) if (inEllipse([x + 0.5, y + 0.5], [cx, cy], rx, ry)) g.set(x, y, c);
};
const L = (g: Img, a: Pt, b: Pt, r: number, c: RGBA) => {
  for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) if (inCapsule([x + 0.5, y + 0.5], a, b, r)) g.set(x, y, c);
};
const ring = (g: Img, cx: number, cy: number, r: number, w: number, c: RGBA) => {
  for (let y = 0; y < 32; y++)
    for (let x = 0; x < 32; x++) {
      const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
      if (d <= r && d >= r - w) g.set(x, y, c);
    }
};

/** Vật thể có viền mực (bỏ qua điểm bán trong suốt như quầng sáng). */
const obj = (d: Draw): Draw => (g) => {
  d(g);
  outline(g, INK, (c) => c[3] < 255);
};
const none: Draw = () => {};
const make = (rows: Draw[][]) =>
  sheet(
    rows.map((row) =>
      row.map((d) => {
        const g = new Img(32, 32);
        d(g);
        return g;
      }),
    ),
  );

// ------------------------------------------------------------------ S13 — Hiệu ứng

/** Bụi tung sau móng: cụm bụi lớn dần rồi tan (k = 0..3). */
const dust = (k: number): Draw => (g) => {
  const puffs: [number, number, number][] = [
    [22, 26, 3 + k],
    [15, 25, 2 + k * 1.4],
    [9, 23 - k, 1 + k * 1.2],
  ];
  const fade = k === 3;
  for (const [x, y, r] of puffs) {
    E(g, x, y, r, r * 0.8, fade ? hex("#C8A878", 150) : K.dust);
    E(g, x - r * 0.3, y - r * 0.3, r * 0.5, r * 0.4, fade ? hex("#E2CCA2", 150) : K.dustLight);
  }
  for (let i = 0; i < 3 + k * 2; i++) P(g, 4 + ((i * 7) % 20), 28 - ((i * 5) % 9) - k, K.dustDark);
  if (!fade) outline(g, hex("#8A6A44"), (c) => c[3] < 255);
};

const sweat = (k: number): Draw =>
  obj((g) => {
    const drops: Pt[] = k ? [[12, 14], [20, 20]] : [[14, 10], [22, 16], [10, 20]];
    for (const [x, y] of drops) {
      E(g, x, y + 2, 2.6, 3, K.sweat);
      L(g, [x, y - 3], [x, y], 0.9, K.sweat);
      P(g, x - 1, y + 1, K.white);
      P(g, x + 1, y + 4, K.sweatDark);
    }
  });

const hoofprint = (k: number): Draw => (g) => {
  for (const [x, y] of k ? [[10, 12], [22, 20]] : [[14, 16]]) {
    ring(g, x, y, 5.5, 2.2, K.hoof);
    R(g, x - 2, y + 2, 5, 4, [0, 0, 0, 0]);
  }
};

const sparkle = (k: number): Draw =>
  obj((g) => {
    const s = [2, 4, 6, 3][k];
    const star = (cx: number, cy: number, r: number) => {
      L(g, [cx - r, cy], [cx + r, cy], 0.6, K.gold);
      L(g, [cx, cy - r], [cx, cy + r], 0.6, K.gold);
      E(g, cx, cy, r * 0.35, r * 0.35, K.goldLight);
    };
    star(16, 15, s + 2);
    if (k > 0) star(25, 7, s * 0.6 + 1);
    if (k > 1) star(8, 24, s * 0.5 + 1);
  });

/** Chớp đỏ sự cố: khối đỏ phát xung lớn dần. */
const flash = (k: number): Draw =>
  obj((g) => {
    const r = 5 + k * 2;
    if (k > 0)
      for (let a = 0; a < 8; a++) {
        const t = (a * Math.PI) / 4;
        L(g, [16 + Math.cos(t) * (r + 2), 16 + Math.sin(t) * (r + 2)], [16 + Math.cos(t) * (r + 2 + k), 16 + Math.sin(t) * (r + 2 + k)], 0.6, K.redLight);
      }
    R(g, 16 - r, 16 - r, r * 2, r * 2, K.redDark);
    R(g, 17 - r, 17 - r, r * 2 - 2, r * 2 - 2, K.red);
    R(g, 17 - r, 17 - r, r - 1, 2, K.redLight);
  });

const lampGlow = (k: number): Draw => (g) => {
  const r = 13 + k * 2;
  E(g, 16, 16, r, r, hex("#FFE9A0", 50));
  E(g, 16, 16, r * 0.62, r * 0.62, hex("#FFE9A0", 110));
  E(g, 16, 16, r * 0.3, r * 0.3, hex("#FFF6D0", 200));
};

const rain = (k: number): Draw => (g) => {
  for (let i = 0; i < 9; i++) {
    const x = (i * 11 + k * 3) % 32;
    const y = (i * 7 + k * 8) % 26;
    L(g, [x + 3, y], [x, y + 6], 0.5, K.rain);
  }
  R(g, 2, 29, 28, 1, K.rainDark); // vũng nước dưới
  E(g, 8 + k * 5, 28, 2 + (k % 2), 1, K.rain);
};

const zzz = (k: number): Draw =>
  obj((g) => {
    E(g, 15, 17, 11, 8, K.zzzBg);
    L(g, [7, 23], [4, 28], 1.1, K.zzzBg); // đuôi bóng thoại
    const z = (x: number, y: number, s: number) => {
      R(g, x, y, s, 1, K.zzz);
      for (let i = 0; i < s; i++) P(g, x + s - 1 - i, y + 1 + i * ((s - 1) / s), K.zzz);
      R(g, x, y + s, s, 1, K.zzz);
    };
    z(8, 13, 5);
    z(15, 15, 4);
    if (k) z(21, 10, 4);
    else z(20, 17, 3);
  });

const heart = (k: number): Draw =>
  obj((g) => {
    const s = k ? 1.15 : 1;
    E(g, 16 - 4 * s, 13, 5 * s, 5 * s, K.heart);
    E(g, 16 + 4 * s, 13, 5 * s, 5 * s, K.heart);
    for (let y = 13; y < 13 + 12 * s; y++) {
      const half = Math.max(0, 9 * s * (1 - (y - 13) / (12 * s)));
      R(g, 16 - half, y, half * 2, 1, K.heart);
    }
    E(g, 11, 11, 2, 1.5, K.heartLight);
  });

const S13: Draw[][] = [
  [dust(0), dust(1), dust(2), dust(3), sweat(0), sweat(1)],
  [hoofprint(0), hoofprint(1), sparkle(0), sparkle(1), sparkle(2), sparkle(3)],
  [flash(0), flash(1), flash(2), flash(3), lampGlow(0), lampGlow(1)],
  [rain(0), rain(1), rain(2), rain(3), none, none],
  [none, none, zzz(0), zzz(1), heart(0), heart(1)],
  [none, none, none, none, none, none],
];

// ------------------------------------------------------------------ S11 — Biểu tượng

/** Nền huy hiệu tròn cho biểu tượng trạng thái. */
const badge = (g: Img, c: RGBA, light: RGBA) => {
  E(g, 16, 16, 13, 13, c);
  E(g, 13, 12, 6, 5, light);
  E(g, 16, 17, 11, 11, c);
};

const icon = (d: Draw) => obj(d);

const S11: Draw[][] = [
  [
    // 6 trạng thái ngựa
    icon((g) => {
      badge(g, K.green, K.greenLight); // sẵn sàng thi đấu: cờ
      L(g, [11, 7], [11, 25], 0.9, K.white);
      R(g, 12, 7, 10, 7, K.white);
      R(g, 14, 9, 2, 2, K.green);
      R(g, 18, 9, 2, 2, K.green);
    }),
    icon((g) => {
      badge(g, K.blue, K.blueLight); // đang tập: mũi tên tốc độ
      L(g, [7, 12], [17, 12], 1, K.white);
      L(g, [9, 17], [21, 17], 1, K.white);
      L(g, [7, 22], [17, 22], 1, K.white);
      L(g, [21, 11], [25, 17], 1.1, K.white);
      L(g, [25, 17], [21, 23], 1.1, K.white);
    }),
    icon((g) => {
      badge(g, K.yellow, K.goldLight); // cần theo dõi: con mắt
      E(g, 16, 16, 9, 5, K.white);
      E(g, 16, 16, 3.5, 3.5, K.dark);
      P(g, 15, 15, K.white);
    }),
    icon((g) => {
      badge(g, K.red, K.redLight); // chấn thương: băng gạc chữ thập
      R(g, 13, 7, 6, 18, K.white);
      R(g, 7, 13, 18, 6, K.white);
      R(g, 15, 9, 2, 14, K.red);
      R(g, 9, 15, 14, 2, K.red);
    }),
    icon((g) => {
      badge(g, K.purple, K.purpleLight); // cách ly: khiên
      for (let y = 7; y < 25; y++) {
        const half = y < 16 ? 8 : 8 * (1 - (y - 16) / 10);
        R(g, 16 - half, y, half * 2, 1, K.white);
      }
      R(g, 15, 9, 2, 12, K.purple);
    }),
    icon((g) => {
      badge(g, hex("#3E4A7A"), hex("#6E7AB0")); // nghỉ ngơi: trăng khuyết
      E(g, 15, 16, 8, 8, K.goldLight);
      E(g, 19, 13, 7, 7, hex("#3E4A7A"));
      P(g, 23, 22, K.white);
      P(g, 9, 9, K.white);
    }),
  ],
  [
    icon((g) => {
      // khóa đỏ (Medical Lock)
      ring(g, 16, 13, 7, 2.5, K.grayDark);
      R(g, 9, 13, 14, 5, [0, 0, 0, 0]);
      R(g, 9, 14, 2, 4, K.grayDark);
      R(g, 21, 14, 2, 4, K.grayDark);
      R(g, 7, 17, 18, 12, K.red);
      R(g, 7, 17, 18, 2, K.redLight);
      R(g, 15, 21, 2, 5, K.dark);
    }),
    icon((g) => {
      // mở khóa (xanh)
      ring(g, 22, 10, 6, 2.5, K.grayDark);
      R(g, 16, 10, 12, 4, [0, 0, 0, 0]);
      R(g, 26, 10, 2, 7, K.grayDark);
      R(g, 5, 17, 18, 12, K.green);
      R(g, 5, 17, 18, 2, K.greenLight);
      R(g, 13, 21, 2, 5, K.dark);
    }),
    icon((g) => {
      // cảnh báo "!"
      for (let y = 4; y < 28; y++) {
        const half = ((y - 4) / 24) * 13;
        R(g, 16 - half, y, half * 2, 1, K.yellow);
      }
      R(g, 15, 11, 3, 9, K.dark);
      R(g, 15, 22, 3, 3, K.dark);
    }),
    icon((g) => {
      // nhịp tim: tim + sóng ECG
      E(g, 11, 11, 6, 6, K.heart);
      E(g, 21, 11, 6, 6, K.heart);
      for (let y = 11; y < 27; y++) R(g, 16 - Math.max(0, 11 * (1 - (y - 11) / 16)), y, Math.max(0, 22 * (1 - (y - 11) / 16)), 1, K.heart);
      const ecg: Pt[] = [[3, 17], [10, 17], [12, 12], [15, 22], [18, 9], [20, 17], [29, 17]];
      for (let i = 1; i < ecg.length; i++) L(g, ecg[i - 1], ecg[i], 0.7, K.white);
    }),
    icon((g) => {
      // thân nhiệt: nhiệt kế
      L(g, [16, 5], [16, 21], 3, K.white);
      E(g, 16, 24, 5, 5, K.red);
      L(g, [16, 12], [16, 22], 1.3, K.red);
      for (const y of [8, 12, 16]) R(g, 20, y, 3, 1, K.grayDark);
    }),
    icon((g) => {
      // tốc độ: đồng hồ đo
      E(g, 16, 18, 13, 12, K.grayLight);
      E(g, 16, 18, 10, 9, K.dark);
      R(g, 3, 23, 26, 8, [0, 0, 0, 0]);
      for (let a = 0; a < 5; a++) {
        const t = Math.PI + (a * Math.PI) / 4;
        P(g, 16 + Math.cos(t) * 8, 18 + Math.sin(t) * 8, a > 2 ? K.red : K.white);
      }
      L(g, [16, 18], [22, 11], 1, K.red);
      E(g, 16, 18, 1.5, 1.5, K.white);
    }),
  ],
  [
    icon((g) => {
      // sải bước: 2 dấu móng + mũi tên
      for (const [x, y] of [[9, 20], [21, 11]]) {
        ring(g, x, y, 4.5, 2, K.wood);
        R(g, x - 2, y + 1, 4, 4, [0, 0, 0, 0]);
      }
      L(g, [6, 28], [26, 28], 0.7, K.dark);
      L(g, [23, 25], [26, 28], 0.7, K.dark);
    }),
    icon((g) => {
      // tần số sải: sóng nhịp
      for (let x = 3; x < 29; x++) P(g, x, 16 + Math.sin(((x - 3) / 26) * Math.PI * 4) * 7, K.blue);
      for (let x = 3; x < 29; x++) P(g, x, 17 + Math.sin(((x - 3) / 26) * Math.PI * 4) * 7, K.blue);
      R(g, 3, 26, 26, 1, K.grayDark);
    }),
    icon((g) => {
      // calo: ngọn lửa
      E(g, 16, 20, 9, 9, K.orange);
      for (let y = 4; y < 20; y++) R(g, 16 - (y - 4) * 0.55, y, (y - 4) * 1.1, 1, K.orange);
      E(g, 16, 22, 5, 6, K.flame);
      E(g, 16, 24, 2.5, 3, K.goldLight);
    }),
    icon((g) => {
      // thể lực: pin
      R(g, 4, 9, 22, 14, K.dark);
      R(g, 26, 13, 3, 6, K.dark);
      R(g, 6, 11, 18, 10, K.grayLight);
      R(g, 6, 11, 13, 10, K.green);
      R(g, 6, 11, 13, 2, K.greenLight);
    }),
    icon((g) => {
      // chip RFID
      R(g, 8, 8, 16, 16, K.dark);
      R(g, 11, 11, 10, 10, K.green);
      R(g, 13, 13, 6, 6, K.gold);
      for (let i = 10; i < 23; i += 4) {
        R(g, i, 4, 2, 4, K.grayLight);
        R(g, i, 24, 2, 4, K.grayLight);
        R(g, 4, i, 4, 2, K.grayLight);
        R(g, 24, i, 4, 2, K.grayLight);
      }
    }),
    icon((g) => {
      // cây phả hệ: 3 thế hệ
      R(g, 13, 4, 6, 5, K.gold);
      L(g, [16, 9], [16, 13], 0.6, K.dark);
      L(g, [8, 13], [24, 13], 0.6, K.dark);
      R(g, 4, 14, 8, 5, K.blue);
      R(g, 20, 14, 8, 5, K.heart);
      L(g, [8, 19], [8, 23], 0.6, K.dark);
      L(g, [24, 19], [24, 23], 0.6, K.dark);
      R(g, 4, 23, 8, 5, K.grayLight);
      R(g, 20, 23, 8, 5, K.grayLight);
    }),
  ],
  [
    icon((g) => {
      // ống tiêm
      L(g, [7, 25], [21, 11], 3, K.ice);
      L(g, [10, 22], [17, 15], 2, K.blueLight);
      L(g, [21, 11], [27, 5], 0.6, K.grayDark);
      L(g, [4, 28], [8, 24], 1.3, K.grayDark);
      L(g, [17, 9], [23, 15], 0.8, K.grayDark);
    }),
    icon((g) => {
      // thuốc tẩy giun: viên con nhộng
      L(g, [8, 22], [24, 10], 5, K.white);
      L(g, [16, 16], [24, 10], 5, K.purple);
      E(g, 20, 11, 2, 1.5, K.purpleLight);
    }),
    icon((g) => {
      // móng sắt
      ring(g, 16, 16, 11, 4, K.gray);
      R(g, 9, 16, 14, 13, [0, 0, 0, 0]);
      R(g, 5, 16, 4, 11, K.gray);
      R(g, 23, 16, 4, 11, K.gray);
      for (const [x, y] of [[8, 12], [12, 7], [20, 7], [24, 12], [6, 20], [26, 20]]) P(g, x, y, K.dark);
    }),
    icon((g) => {
      // bao thức ăn
      E(g, 16, 19, 10, 10, K.paperDark);
      E(g, 14, 17, 7, 7, K.paper);
      R(g, 12, 4, 8, 6, K.paperDark);
      R(g, 11, 9, 10, 2, K.wood);
      E(g, 16, 20, 3, 3, K.green);
    }),
    icon((g) => {
      // vòi tắm: cuộn vòi xanh + vòi phun tia nước
      ring(g, 13, 18, 9, 3, K.green);
      ring(g, 13, 18, 4, 2, K.green);
      R(g, 20, 8, 7, 4, K.grayDark);
      L(g, [21, 12], [19, 15], 1.2, K.green);
      for (let i = 0; i < 4; i++) L(g, [27, 9], [30, 13 + i * 3], 0.45, K.sweatDark);
    }),
    icon((g) => {
      // xô nước đá: quai cung trên miệng xô, đá viên nhô lên
      for (let t = 0; t <= Math.PI; t += 0.02) P(g, 16 - Math.cos(t) * 10, 13 - Math.sin(t) * 8, K.grayDark);
      R(g, 9, 8, 6, 6, K.ice);
      R(g, 16, 9, 6, 5, K.ice);
      R(g, 12, 6, 5, 5, K.white);
      for (let y = 13; y < 28; y++) R(g, 6 + (y - 13) * 0.25, y, 20 - (y - 13) * 0.5, 1, K.gray);
      R(g, 6, 13, 20, 2, K.grayLight);
      R(g, 8, 20, 16, 1, K.grayDark);
    }),
  ],
  [
    icon((g) => {
      // báo cáo sự cố: bảng kẹp giấy có "!"
      R(g, 7, 5, 18, 23, K.wood);
      R(g, 9, 8, 14, 18, K.paper);
      R(g, 12, 3, 8, 4, K.grayDark);
      R(g, 15, 11, 2, 8, K.red);
      R(g, 15, 21, 2, 2, K.red);
    }),
    icon((g) => {
      // chuông thông báo
      E(g, 16, 15, 8, 9, K.gold);
      R(g, 6, 20, 20, 4, K.gold);
      E(g, 13, 12, 2, 3, K.goldLight);
      E(g, 16, 26, 2.5, 2, K.goldDark);
      R(g, 15, 4, 2, 3, K.gold);
    }),
    icon((g) => {
      // đồng hồ
      E(g, 16, 16, 12, 12, K.white);
      ring(g, 16, 16, 12, 2, K.grayDark);
      L(g, [16, 16], [16, 9], 0.8, K.dark);
      L(g, [16, 16], [21, 18], 0.8, K.dark);
      for (let a = 0; a < 12; a++) P(g, 16 + Math.cos((a * Math.PI) / 6) * 9, 16 + Math.sin((a * Math.PI) / 6) * 9, K.grayDark);
    }),
    icon((g) => {
      // mặt trời
      for (let a = 0; a < 8; a++) {
        const t = (a * Math.PI) / 4;
        L(g, [16 + Math.cos(t) * 9, 16 + Math.sin(t) * 9], [16 + Math.cos(t) * 13, 16 + Math.sin(t) * 13], 1, K.orange);
      }
      E(g, 16, 16, 7, 7, K.gold);
      E(g, 14, 14, 3, 3, K.goldLight);
    }),
    icon((g) => {
      // mặt trăng
      E(g, 15, 16, 11, 11, K.goldLight);
      E(g, 21, 12, 9, 9, [0, 0, 0, 0]);
      E(g, 10, 18, 2, 2, K.paperDark);
    }),
    icon((g) => {
      // cân (cân nặng)
      R(g, 5, 18, 22, 10, K.grayLight);
      R(g, 5, 18, 22, 2, K.white);
      E(g, 16, 12, 8, 7, K.white);
      ring(g, 16, 12, 8, 1.5, K.grayDark);
      L(g, [16, 12], [20, 8], 0.7, K.red);
    }),
  ],
  [
    icon((g) => {
      // thước (chiều cao)
      R(g, 12, 3, 8, 26, K.gold);
      for (let y = 5; y < 28; y += 3) R(g, 12, y, y % 6 === 2 ? 5 : 3, 1, K.dark);
    }),
    icon((g) => {
      // xe chở ngựa thu nhỏ
      R(g, 3, 9, 18, 13, K.grayLight);
      for (let x = 7; x < 21; x += 4) R(g, x, 10, 1, 11, K.gray);
      R(g, 22, 13, 8, 9, K.white);
      R(g, 24, 14, 5, 3, K.sweat);
      E(g, 9, 24, 3, 3, K.dark);
      E(g, 26, 24, 3, 3, K.dark);
    }),
    icon((g) => {
      // sổ nhật ký Audit Log (gáy lò xo)
      R(g, 7, 4, 19, 24, K.blue);
      R(g, 10, 6, 14, 20, K.paper);
      for (let y = 6; y < 26; y += 4) R(g, 5, y, 4, 2, K.grayLight);
      for (let y = 10; y < 24; y += 3) R(g, 12, y, 10, 1, K.paperDark);
    }),
    icon((g) => {
      // hồ sơ ngựa (bìa hồ sơ)
      R(g, 5, 8, 22, 18, K.gold);
      R(g, 5, 6, 9, 3, K.gold);
      R(g, 7, 11, 18, 13, K.paper);
      E(g, 12, 16, 2.5, 2.5, K.wood);
      R(g, 16, 14, 7, 1, K.paperDark);
      R(g, 16, 17, 7, 1, K.paperDark);
    }),
    icon((g) => {
      // lịch định kỳ (tiêm phòng / tẩy giun / móng)
      R(g, 5, 7, 22, 20, K.white);
      R(g, 5, 7, 22, 5, K.red);
      R(g, 9, 4, 2, 5, K.grayDark);
      R(g, 21, 4, 2, 5, K.grayDark);
      for (let y = 14; y < 26; y += 4) for (let x = 7; x < 25; x += 4) R(g, x, y, 2, 2, K.grayLight);
      R(g, 15, 18, 2, 2, K.red);
    }),
    icon((g) => {
      // tiền thưởng / tài chính: chồng xu có viền từng đồng
      for (let i = 0; i < 4; i++) {
        const y = 25 - i * 4;
        E(g, 16, y + 1, 9, 3, K.goldDark);
        E(g, 16, y, 9, 3, K.gold);
        R(g, 8, y + 1, 16, 1, K.goldDark);
      }
      E(g, 16, 12, 9, 3, K.goldLight);
      R(g, 15, 11, 2, 2, K.goldDark);
    }),
  ],
];

// ------------------------------------------------------------------ Xuất

const s13 = make(S13);
const s11 = make(S11);
for (let r = 0; r < 6; r++)
  for (let c = 0; c < 6; c++) {
    let n = 0;
    for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) if (s11.alpha(c * 32 + x, r * 32 + y) > 0) n++;
    assert.ok(n > 60, `S11 hàng ${r + 1} cột ${c + 1} trống`);
  }

const root = new URL("../..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
for (const [name, img] of [["s13-fx", s13], ["s11-icons", s11]] as const) {
  savePng(`${root}art/png/${name}.png`, img);
  savePng(`${root}art/preview/${name}-x4.png`, preview(img, 4));
  copyFileSync(`${root}art/png/${name}.png`, `${root}public/assets/sprites/${name}.png`);
}
console.log("OK s13-fx, s11-icons (192×192)");
