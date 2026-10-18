import type { Point, Rect } from "./farmLayout";

export interface AlphaMask { width: number; height: number; alpha: Uint8ClampedArray }
export interface HitObject { id: string; z: number; bounds: Rect }

export function hitTestObjects<T extends HitObject>(
  viewportPoint: Point,
  camera: Point,
  objects: readonly T[],
  masks: ReadonlyMap<string, AlphaMask>,
): T | null {
  const worldX = viewportPoint.x + camera.x;
  const worldY = viewportPoint.y + camera.y;
  for (const object of [...objects].sort((a, b) => b.z - a.z)) {
    const x = Math.floor(worldX - object.bounds.x);
    const y = Math.floor(worldY - object.bounds.y);
    if (x < 0 || y < 0 || x >= object.bounds.w || y >= object.bounds.h) continue;
    const mask = masks.get(object.id);
    if (mask && x < mask.width && y < mask.height && mask.alpha[y * mask.width + x] > 0) return object;
  }
  return null;
}

export function alphaMaskFromImage(image: CanvasImageSource, width: number, height: number): AlphaMask {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Canvas 2D không khả dụng");
  ctx.drawImage(image, 0, 0);
  const rgba = ctx.getImageData(0, 0, width, height).data;
  const alpha = new Uint8ClampedArray(width * height);
  for (let i = 0; i < alpha.length; i++) alpha[i] = rgba[i * 4 + 3];
  return { width, height, alpha };
}
