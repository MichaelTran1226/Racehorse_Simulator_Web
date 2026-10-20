// Nạp duy nhất các sprite PNG đã duyệt và đổi màu lông / màu áo nài.
import { useEffect, useState } from "react";
import type { Coat } from "../sim/engine.ts";
import type { CritterSheet } from "../hub/ambientScene.ts";
import { CRITTER_URLS } from "./farmAssets.ts";
import { swapExact } from "./palette.ts";

const CRITTER_SHEETS = Object.keys(CRITTER_URLS) as CritterSheet[];

export interface Sheet {
  canvas: HTMLCanvasElement;
  cols: number;
  cw: number;
  /** Dải y [đầu, cuối] của từng hàng — ảnh concept không chia đều theo lưới nên đo tay từng hàng. */
  bands: [number, number][];
  /** Hệ số để ngựa ở các sheet khác nhau cân cỡ với S01. */
  scale: number;
  /** PNG vẽ lại đúng bảng màu SRS → đổi màu chính xác; false = ảnh concept JPEG (ước lượng). */
  exact: boolean;
}

export interface Sprites {
  horse: Sheet; // S01: H0 đứng · H1 đi bộ · H2 kiệu · H3 phi · H4 ăn/nằm · H5 đặc biệt (khập khiễng "!")
  stall: Sheet; // S07: Ô chuồng 32×32
  rider: Sheet; // S14: H4 = ngựa + nài phi nước đại (6 khung)
  fx: Sheet; // S13: H0 bụi · H2 chớp đỏ · H4 zzz / tim
  people: Sheet; // S06: H0 quản lý · H1 HLV · H2 VET · H3 groom · H4 chủ ngựa · H5 nài — cột 0–3 đi bộ, 4 đứng, 5 hành động
  vehicles: HTMLCanvasElement;
  critters: Record<CritterSheet, HTMLCanvasElement>; // con vật Stardew (gà, vịt, chó, mèo) — thay S16
}

/** Khung xe trong S15 6×6 ô 32 px: [sx, sy, sw, sh]. */
export const VEHICLE_RECT = {
  truck: [0, 0, 128, 32], // H1 xe tải + thùng (đóng)
  truckOpen: [0, 32, 128, 32], // H2 hạ cầu dắt
  barrow: [96, 96, 32, 32], // H4 xe cút kít rỗng
  barrowLoaded: [128, 96, 32, 32],
  hayCart: [0, 128, 64, 32], // H5
  cart: [0, 160, 64, 32], // H6 xe điện trống
  cartDriver: [64, 160, 64, 32],
} as const;

export const ROW = { IDLE: 0, WALK: 1, TROT: 2, GALLOP: 3, REST: 4, SPECIAL: 5 } as const;

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Không tải được sprite ${url}`));
    img.src = url;
  });
}

async function loadSheet(url: string, cols: number, bands: [number, number][], scale = 1, exact = false): Promise<Sheet> {
  const img = await loadImage(url);
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Canvas 2D không khả dụng");
  ctx.drawImage(img, 0, 0);
  return { canvas, cols, cw: canvas.width / cols, bands, scale, exact };
}

/** Sheet PNG chuẩn SRS 6×6 ô 32×32 (art/gen); scale để 1 ô 32 px vẽ bằng kích thước 1 ô concept. */
function pixelSheet(url: string): Promise<Sheet> {
  const bands = Array.from({ length: 6 }, (_, r) => [r * 32 + 3, r * 32 + 29] as [number, number]);
  return loadSheet(url, 6, bands, 127.5 / 32, true);
}

// ------------------------------------------------------------ Đổi màu

const luma = (r: number, g: number, b: number) => 0.299 * r + 0.587 * g + 0.114 * b;

/** Áo/mũ nài đỏ #D32F2F của sprite gốc. */
const isSilk = (r: number, g: number, b: number) => r > 165 && g < 80 && b < 80 && r - g > 105;
/** Điểm ảnh thuộc thân ngựa (ấm hoặc rất tối) — bỏ qua bóng xanh xám và vải trắng của nài. */
function isCoat(r: number, g: number, b: number) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  if (max > 175 && max - min < 30) return false; // trắng / xám sáng (quần nài, dây cương)
  return r >= b + 8 || luma(r, g, b) < 60;
}

function hexRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function coatPixel(coat: Coat, r: number, g: number, b: number, x: number, y: number): [number, number, number] {
  const L = luma(r, g, b);
  switch (coat) {
    case "BAY":
      return [r, g, b];
    case "CHESTNUT": // bờm/đuôi cùng tông hung đỏ với thân
      return L < 60 ? [L * 1.7 + 45, L * 0.75 + 18, L * 0.35 + 6] : [r * 1.12 + 12, g * 1.08 + 10, b * 0.75];
    case "BLACK": {
      const k = L * 0.42 + 10;
      return [k, k * 0.96, k * 1.08];
    }
    case "GRAY": {
      if (L < 35) return [58, 58, 64]; // giữ viền
      const k = Math.min(240, 95 + L * 1.05);
      return [k, k, k * 1.02];
    }
    case "ROAN": {
      if (L < 35) return [50, 44, 44];
      const speck = ((x * 73856093) ^ (y * 19349663)) % 5 === 0; // đốm lông trắng li ti
      if (speck) return [228, 226, 224];
      const k = 70 + L * 0.85;
      return [k * 1.05, k * 0.95, k * 0.92];
    }
  }
}

// Cache theo chính canvas nguồn: S01 và S14 cùng kích thước 1024×765 nên khóa theo kích thước từng bị trùng
// → lấy nhầm sheet ngựa trơn cho ngựa có nài (sprite bị cắt đôi / đảo lộn khi đua).
const cache = new WeakMap<HTMLCanvasElement, Map<string, HTMLCanvasElement>>();

/** Bản tô màu của cả sheet (cache theo sheet + màu) — làm một lần, vẽ mỗi khung chỉ là drawImage. */
export function tinted(sheet: Sheet, coat: Coat, silkHex?: string): HTMLCanvasElement {
  const key = `${coat}:${silkHex ?? ""}`;
  let perSheet = cache.get(sheet.canvas);
  if (!perSheet) cache.set(sheet.canvas, (perSheet = new Map()));
  const hit = perSheet.get(key);
  if (hit) return hit;
  if (coat === "BAY" && !silkHex) return sheet.canvas;
  if (sheet.exact) {
    const out = document.createElement("canvas");
    out.width = sheet.canvas.width;
    out.height = sheet.canvas.height;
    const octx = out.getContext("2d", { willReadFrequently: true });
    if (!octx) return sheet.canvas;
    octx.drawImage(sheet.canvas, 0, 0);
    const d = octx.getImageData(0, 0, out.width, out.height);
    swapExact(d, coat, silkHex);
    octx.putImageData(d, 0, 0);
    perSheet.set(key, out);
    return out;
  }

  const out = document.createElement("canvas");
  out.width = sheet.canvas.width;
  out.height = sheet.canvas.height;
  const ctx = out.getContext("2d", { willReadFrequently: true });
  if (!ctx) return sheet.canvas;
  ctx.drawImage(sheet.canvas, 0, 0);
  const data = ctx.getImageData(0, 0, out.width, out.height);
  const p = data.data;
  const silk = silkHex ? hexRgb(silkHex) : null;
  for (let i = 0; i < p.length; i += 4) {
    if (p[i + 3] === 0) continue;
    const r = p[i];
    const g = p[i + 1];
    const b = p[i + 2];
    let o: [number, number, number] | null = null;
    if (silk && isSilk(r, g, b)) {
      const k = r / 211;
      o = [silk[0] * k, silk[1] * k, silk[2] * k];
    } else if (coat !== "BAY" && isCoat(r, g, b)) {
      const px = (i / 4) % out.width;
      const py = Math.floor(i / 4 / out.width);
      o = coatPixel(coat, r, g, b, px >> 2, py >> 2);
    }
    if (o) {
      p[i] = Math.min(255, o[0]);
      p[i + 1] = Math.min(255, o[1]);
      p[i + 2] = Math.min(255, o[2]);
    }
  }
  ctx.putImageData(data, 0, 0);
  perSheet.set(key, out);
  return out;
}

/** Chiều cao 1 ô chuẩn của S01 (px ảnh gốc): tham số `h` của drawFrame là chiều cao vẽ của ô chuẩn này. */
export const REF_CELL = 127.5;
const PAD = 3;

/** Vẽ 1 khung, neo đáy dải hàng (đường chân y = 30/32 của SRS) tại (x, baseY). */
export function drawFrame(
  ctx: CanvasRenderingContext2D,
  sheet: Sheet,
  src: HTMLCanvasElement,
  col: number,
  row: number,
  x: number,
  baseY: number,
  h: number,
  flip = false,
): void {
  const [y0, y1] = sheet.bands[row];
  const k = (h / REF_CELL) * sheet.scale;
  const sh = y1 - y0 + PAD * 2;
  drawRect(ctx, src, [col * sheet.cw, y0 - PAD, sheet.cw, sh], x, baseY + PAD * k, k, flip);
}

/** Vẽ một vùng ảnh nguồn [sx, sy, sw, sh] với tỉ lệ k, neo đáy-giữa tại (x, baseY); flip = quay sang trái. */
export function drawRect(
  ctx: CanvasRenderingContext2D,
  src: CanvasImageSource,
  [sx, sy, sw, sh]: readonly number[],
  x: number,
  baseY: number,
  k: number,
  flip = false,
): void {
  const dw = sw * k;
  const dh = sh * k;
  if (!flip) {
    ctx.drawImage(src, sx, sy, sw, sh, x - dw / 2, baseY - dh, dw, dh);
    return;
  }
  ctx.save();
  ctx.translate(x, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(src, sx, sy, sw, sh, -dw / 2, baseY - dh, dw, dh);
  ctx.restore();
}

let promise: Promise<Sprites> | null = null;

export function useSprites(): { sprites: Sprites | null; error: string | null } {
  const [sprites, setSprites] = useState<Sprites | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    promise ??= Promise.all([
      pixelSheet("/assets/sprites/s01-horse.png"), // vẽ lại — art/gen/horse.ts
      pixelSheet("/assets/sprites/s07-stall.png"),
      pixelSheet("/assets/sprites/s14-rider.png"),
      pixelSheet("/assets/sprites/s13-fx.png"),
      pixelSheet("/assets/sprites/s06-people.png"),
      pixelSheet("/assets/sprites/s15-vehicles.png"),
      Promise.all(CRITTER_SHEETS.map((name) => pixelSheet(CRITTER_URLS[name]))),
    ]).then(([horse, stall, rider, fx, people, vehicles, critters]) => ({
      horse,
      stall,
      rider,
      fx,
      people,
      vehicles: vehicles.canvas,
      critters: Object.fromEntries(CRITTER_SHEETS.map((name, i) => [name, critters[i].canvas])) as Record<CritterSheet, HTMLCanvasElement>,
    }));
    let alive = true;
    promise.then(
      (s) => alive && setSprites(s),
      (e: unknown) => alive && setError(e instanceof Error ? e.message : String(e)),
    );
    return () => {
      alive = false;
    };
  }, []);
  return { sprites, error };
}
