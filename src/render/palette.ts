// Palette swap chính xác theo SRS §12 cho sprite PNG vẽ lại (art/gen): thay đúng mã hex, không ước lượng.
import type { Coat } from "../sim/engine";

/** 8 màu lông dành riêng theo thứ tự: thân sáng · vừa · tối · bóng · bờm sáng · bờm tối · cẳng sáng · cẳng tối. */
export const COAT_HEX: Record<Exclude<Coat, "ROAN">, string[]> = {
  BAY: ["#B85C38", "#8B3C1B", "#5A2510", "#D77B54", "#2E2E2E", "#141414", "#212121", "#0D0D0D"],
  CHESTNUT: ["#E28743", "#B2531B", "#7E3108", "#F0A15E", "#ECC082", "#B07C3D", "#8A3D16", "#5C280C"],
  BLACK: ["#38383F", "#24242A", "#121216", "#4E4E57", "#47474E", "#1D1D21", "#323238", "#17171C"],
  GRAY: ["#ECECEC", "#CDCDCD", "#9B9B9B", "#FFFFFF", "#A8A8A8", "#737373", "#8E8E8E", "#5A5A5A"],
};

/** Áo nài gốc (làn 1) — 3 màu dành riêng: áo chính, sọc, mũ (SRS §12-B; mũ trùng mã áo chính). */
export const SILK_PRIMARY = "#D32F2F";

const rgb = (h: string) => {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255] as const;
};
const key = (r: number, g: number, b: number) => (r << 16) | (g << 8) | b;

/**
 * Tô lại ImageData tại chỗ: lông Bay → màu lông đích, áo nài đỏ → màu làn.
 * Roan (SRS không có bảng riêng) = nền Gray + đốm lông trắng li ti trên thân.
 */
export function swapExact(data: ImageData, coat: Coat, silkHex?: string): void {
  const map = new Map<number, readonly [number, number, number]>();
  const target = COAT_HEX[coat === "ROAN" ? "GRAY" : coat];
  COAT_HEX.BAY.forEach((from, i) => map.set(key(...rgb(from)), rgb(target[i])));
  if (silkHex) map.set(key(...rgb(SILK_PRIMARY)), rgb(silkHex));
  const body = new Set(COAT_HEX.BAY.slice(0, 4).map((h) => key(...rgb(h))));
  const p = data.data;
  for (let i = 0; i < p.length; i += 4) {
    if (p[i + 3] === 0) continue;
    const k = key(p[i], p[i + 1], p[i + 2]);
    const to = map.get(k);
    if (!to) continue;
    let [r, g, b] = to;
    if (coat === "ROAN" && body.has(k)) {
      const x = (i / 4) % data.width;
      const y = Math.floor(i / 4 / data.width);
      if (((x * 73856093) ^ (y * 19349663)) % 4 === 0) [r, g, b] = [250, 250, 250];
      else [r, g, b] = [r * 0.72, g * 0.66, b * 0.64]; // nền xám pha nâu
    }
    p[i] = r;
    p[i + 1] = g;
    p[i + 2] = b;
  }
}
