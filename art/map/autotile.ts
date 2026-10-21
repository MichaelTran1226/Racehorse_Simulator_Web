export type Mask = boolean[][];

export function dirtTile(n: boolean, e: boolean, s: boolean, w: boolean): { c: number; r: number } {
  if (!e && !w) return { c: 0, r: n && s ? 2 : s ? 1 : n ? 3 : 0 };
  if (!n && !s) return { c: e && w ? 2 : e ? 1 : 3, r: 3 };
  return { c: !w ? 1 : !e ? 3 : 2, r: !n ? 0 : !s ? 2 : 1 };
}

export function fillRect(m: Mask, x0: number, y0: number, x1: number, y1: number, v = true): void {
  for (let y = y0; y <= y1; y++)
    for (let x = x0; x <= x1; x++)
      if (y >= 0 && x >= 0 && y < m.length && x < (m[y]?.length ?? 0)) m[y][x] = v;
}

export function ring(m: Mask, x0: number, y0: number, x1: number, y1: number, w: number): void {
  fillRect(m, x0, y0, x1, y1);
  fillRect(m, x0 + w, y0 + w, x1 - w, y1 - w, false);
  for (const [cx, cy, sx, sy] of [[x0, y0, 1, 1], [x1, y0, -1, 1], [x0, y1, 1, -1], [x1, y1, -1, -1]])
    for (let k = 0; k < 3; k++)
      for (let j = 0; j < 3 - k; j++) {
        const x = cx + sx * j, y = cy + sy * k;
        if (y >= 0 && x >= 0 && y < m.length && x < (m[y]?.length ?? 0)) m[y][x] = false;
      }
}

export function dirtTiles(m: Mask): { x: number; y: number; c: number; r: number }[] {
  const tiles = [];
  const d = (x: number, y: number) => y >= 0 && x >= 0 && y < m.length && x < (m[y]?.length ?? 0) && m[y][x];
  for (let y = 0; y < m.length; y++)
    for (let x = 0; x < m[y].length; x++)
      if (m[y][x]) {
        const { c, r } = dirtTile(d(x, y - 1), d(x + 1, y), d(x, y + 1), d(x - 1, y));
        tiles.push({ x, y, c, r });
      }
  return tiles;
}

/** Vòng hình sân vận động (đường đua bầu dục): ô nằm trong hình ngoài nhưng ngoài hình trong, bề rộng `w` ô. */
export function stadiumRing(m: Mask, x0: number, y0: number, x1: number, y1: number, w: number): void {
  const r = (y1 + 1 - y0) / 2, cy = y0 + r, ax = x0 + r, bx = x1 + 1 - r;
  for (let y = y0; y <= y1; y++)
    for (let x = x0; x <= x1; x++) {
      const px = x + 0.5, py = y + 0.5;
      const d = Math.hypot(px - Math.max(ax, Math.min(bx, px)), py - cy);
      if (d <= r && d > r - w && y >= 0 && x >= 0 && y < m.length && x < (m[y]?.length ?? 0)) m[y][x] = true;
    }
}
