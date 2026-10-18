import { FARM_OBJECTS } from "../hub/farmLayout.ts";
import type { FarmAssets } from "./farmAssets";

export type FarmSceneAssets = FarmAssets;

export function drawFarmScene(
  ctx: CanvasRenderingContext2D,
  assets: FarmSceneAssets,
  time: number,
  drawActors?: (ctx: CanvasRenderingContext2D, time: number) => void,
  /** Công trình vừa được chạm: nhún co giãn quanh chân công trình. */
  squash?: { id: string; sx: number; sy: number } | null,
): void {
  ctx.drawImage(assets.ground, 0, 0);
  for (const object of [...FARM_OBJECTS].sort((a, b) => a.z - b.z)) {
    const image = assets.objects.get(object.id);
    if (!image) continue;
    if (squash?.id !== object.id) {
      ctx.drawImage(image, object.bounds.x, object.bounds.y);
      continue;
    }
    const { x, y, w, h } = object.bounds;
    ctx.save();
    ctx.translate(x + w / 2, y + h);
    ctx.scale(squash.sx, squash.sy);
    ctx.drawImage(image, -w / 2, -h);
    ctx.restore();
  }
  drawActors?.(ctx, time);
}

export const SQUASH_MS = 380;

/** Nhún kiểu Hay Day khi chạm: dẹt xuống rồi bật lên, tắt dần; bằng 1 ở đầu và cuối. */
export function squashScale(elapsedMs: number): { sx: number; sy: number } {
  const p = Math.min(1, Math.max(0, elapsedMs / SQUASH_MS));
  const wave = Math.sin(2 * Math.PI * p) * (1 - p);
  return { sx: 1 + 0.06 * wave, sy: 1 - 0.1 * wave };
}
