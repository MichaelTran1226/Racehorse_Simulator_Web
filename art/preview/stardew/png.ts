// Giải mã PNG RGBA8 không interlace (đủ cho sheet Stardew) thành Img.
import { readFileSync } from "node:fs";
import { inflateSync } from "node:zlib";
import { Img } from "file:///E:/01_Academic_FPT/Courses/Se_5_Active/SWP391/MINH_Racehorse_Branch/Racehorse_Simulator_Web/art/gen/pixel.ts";
export { Img };
export function loadPng(path: string): Img {
  const b = readFileSync(path);
  let p = 8, w = 0, h = 0; const idat: Buffer[] = [];
  while (p < b.length) {
    const len = b.readUInt32BE(p), type = b.toString("ascii", p + 4, p + 8), d = b.subarray(p + 8, p + 8 + len);
    if (type === "IHDR") { w = d.readUInt32BE(0); h = d.readUInt32BE(4); if (d[8] !== 8 || d[9] !== 6 || d[12]) throw new Error("not RGBA8 " + path); }
    if (type === "IDAT") idat.push(d);
    p += 12 + len;
  }
  const raw = inflateSync(Buffer.concat(idat)), img = new Img(w, h), st = w * 4;
  const prev = new Uint8Array(st), cur = new Uint8Array(st);
  for (let y = 0; y < h; y++) {
    const f = raw[y * (st + 1)];
    for (let x = 0; x < st; x++) {
      const v = raw[y * (st + 1) + 1 + x], a = x >= 4 ? cur[x - 4] : 0, up = prev[x], c = x >= 4 ? prev[x - 4] : 0;
      let r = v;
      if (f === 1) r = v + a; else if (f === 2) r = v + up; else if (f === 3) r = v + ((a + up) >> 1);
      else if (f === 4) { const pp = a + up - c, pa = Math.abs(pp - a), pb = Math.abs(pp - up), pc = Math.abs(pp - c); r = v + (pa <= pb && pa <= pc ? a : pb <= pc ? up : c); }
      cur[x] = r & 255;
    }
    img.data.set(cur, y * st); prev.set(cur);
  }
  return img;
}
export function crop(src: Img, x: number, y: number, w: number, h: number): Img {
  const o = new Img(w, h);
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) o.set(i, j, src.get(x + i, y + j));
  return o;
}
