// Bộ vẽ pixel tối giản để sinh sprite bằng code: ảnh RGBA, hình học (elip, đa giác, "con nhộng" cho chân),
// tự viền 1 px, ghép sheet và ghi PNG (chỉ dùng node:zlib, không cần thư viện ngoài).
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { deflateSync } from "node:zlib";

export type RGBA = readonly [number, number, number, number];
export type Pt = readonly [number, number];

export function hex(h: string, a = 255): RGBA {
  const n = parseInt(h.replace("#", ""), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255, a];
}

export class Img {
  w: number;
  h: number;
  data: Uint8ClampedArray;
  constructor(w: number, h: number) {
    this.w = w;
    this.h = h;
    this.data = new Uint8ClampedArray(w * h * 4);
  }
  get(x: number, y: number): RGBA {
    const i = (y * this.w + x) * 4;
    return [this.data[i], this.data[i + 1], this.data[i + 2], this.data[i + 3]];
  }
  set(x: number, y: number, c: RGBA): void {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    const i = (y * this.w + x) * 4;
    this.data[i] = c[0];
    this.data[i + 1] = c[1];
    this.data[i + 2] = c[2];
    this.data[i + 3] = c[3];
  }
  alpha(x: number, y: number): number {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return 0;
    return this.data[(y * this.w + x) * 4 + 3];
  }
  /** Chép ảnh nguồn lên (dx, dy); chỉ chép điểm có alpha > 0 (đè, không trộn). */
  blit(src: Img, dx: number, dy: number): void {
    for (let y = 0; y < src.h; y++)
      for (let x = 0; x < src.w; x++) {
        const c = src.get(x, y);
        if (c[3] > 0) this.set(dx + x, dy + y, c);
      }
  }
  /** Phóng to nearest-neighbor (để xem trước). */
  scaled(k: number): Img {
    const out = new Img(this.w * k, this.h * k);
    for (let y = 0; y < out.h; y++) for (let x = 0; x < out.w; x++) out.set(x, y, this.get(Math.floor(x / k), Math.floor(y / k)));
    return out;
  }
}

// ------------------------------------------------------------------ Hình học (tọa độ thực, test tại tâm pixel)

export function inEllipse(p: Pt, c: Pt, rx: number, ry: number): boolean {
  const dx = (p[0] - c[0]) / rx;
  const dy = (p[1] - c[1]) / ry;
  return dx * dx + dy * dy <= 1;
}

export function inPolygon(p: Pt, poly: readonly Pt[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > p[1] !== yj > p[1] && p[0] < ((xj - xi) * (p[1] - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

/** Khoảng cách từ điểm tới đoạn thẳng ab ≤ r ("con nhộng" — dùng cho chân, đuôi, tay). */
export function inCapsule(p: Pt, a: Pt, b: Pt, r: number): boolean {
  return segDist(p, a, b) <= r;
}

export function segDist(p: Pt, a: Pt, b: Pt): number {
  const vx = b[0] - a[0];
  const vy = b[1] - a[1];
  const len2 = vx * vx + vy * vy || 1e-9;
  const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * vx + (p[1] - a[1]) * vy) / len2));
  return Math.hypot(p[0] - (a[0] + vx * t), p[1] - (a[1] + vy * t));
}

/** Tham số t (0..1) của hình chiếu điểm lên đoạn ab. */
export function segT(p: Pt, a: Pt, b: Pt): number {
  const vx = b[0] - a[0];
  const vy = b[1] - a[1];
  const len2 = vx * vx + vy * vy || 1e-9;
  return Math.max(0, Math.min(1, ((p[0] - a[0]) * vx + (p[1] - a[1]) * vy) / len2));
}

export const deg = (d: number) => (d * Math.PI) / 180;

/** Xoay điểm p quanh tâm c một góc a (radian, chiều kim đồng hồ trên màn hình vì trục y hướng xuống). */
export function rot(p: Pt, c: Pt, a: number): Pt {
  const s = Math.sin(a);
  const k = Math.cos(a);
  const x = p[0] - c[0];
  const y = p[1] - c[1];
  return [c[0] + x * k - y * s, c[1] + x * s + y * k];
}

/** Điểm cuối của đoạn dài len bắt đầu ở a, góc tính từ phương thẳng đứng xuống (dương = hướng về trước, +x). */
export function limb(a: Pt, angleDeg: number, len: number): Pt {
  const t = deg(angleDeg);
  return [a[0] + Math.sin(t) * len, a[1] + Math.cos(t) * len];
}

/** Viền 1 px: điểm trong suốt nằm cạnh (4 hướng) điểm đặc → tô màu viền. `skip` = màu không tạo viền (bóng đổ). */
export function outline(img: Img, color: RGBA, skip?: (c: RGBA) => boolean): void {
  const solid = (x: number, y: number) => {
    if (img.alpha(x, y) === 0) return false;
    return !skip || !skip(img.get(x, y));
  };
  const marks: Pt[] = [];
  for (let y = 0; y < img.h; y++)
    for (let x = 0; x < img.w; x++) {
      if (solid(x, y)) continue;
      if (solid(x - 1, y) || solid(x + 1, y) || solid(x, y - 1) || solid(x, y + 1)) marks.push([x, y]);
    }
  for (const [x, y] of marks) img.set(x, y, color);
}

// ------------------------------------------------------------------ PNG

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf: Uint8Array): number {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 255] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Uint8Array): Buffer {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, "ascii"), Buffer.from(data)]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}

export function encodePng(img: Img): Buffer {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(img.w, 0);
  ihdr.writeUInt32BE(img.h, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  const raw = Buffer.alloc((img.w * 4 + 1) * img.h);
  for (let y = 0; y < img.h; y++) {
    raw[y * (img.w * 4 + 1)] = 0; // bộ lọc None
    Buffer.from(img.data.buffer, y * img.w * 4, img.w * 4).copy(raw, y * (img.w * 4 + 1) + 1);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", new Uint8Array()),
  ]);
}

export function savePng(path: string, img: Img): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, encodePng(img));
}

/** Ghép các khung 32×32 thành sheet cols×rows (ô trống để trong suốt). */
export function sheet(frames: (Img | null)[][], cell = 32, cols = 6, rows = 6): Img {
  const out = new Img(cell * cols, cell * rows);
  frames.forEach((row, r) => row.forEach((f, c) => f && out.blit(f, c * cell, r * cell)));
  return out;
}

/** Ảnh xem trước: nền ô cờ + lưới ô, phóng to k lần. */
export function preview(src: Img, k: number, cell = 32): Img {
  const big = new Img(src.w * k, src.h * k);
  for (let y = 0; y < big.h; y++)
    for (let x = 0; x < big.w; x++) {
      const checker = (Math.floor(x / 8) + Math.floor(y / 8)) % 2 ? hex("#d9dfe2") : hex("#c8d0d4");
      const grid = x % (cell * k) === 0 || y % (cell * k) === 0;
      const c = src.get(Math.floor(x / k), Math.floor(y / k));
      big.set(x, y, c[3] > 0 ? c : grid ? hex("#ff4fa8") : checker);
    }
  return big;
}

/** Xoay ảnh 90° theo chiều kim đồng hồ (dùng cho ô đường dọc từ ô đường ngang). */
export function rotate90(src: Img): Img {
  const out = new Img(src.h, src.w);
  for (let y = 0; y < src.h; y++) for (let x = 0; x < src.w; x++) out.set(src.h - 1 - y, x, src.get(x, y));
  return out;
}
