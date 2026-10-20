// Vẽ ngựa thật đứng trong ô cửa mở của 2 Barn và dưới mái che Stable (bản đồ Stardew, anchors trong farm-layout.json).
import type { StableHorseAssignment } from "../hub/farmPopulation.ts";
import { drawFrame, ROW, tinted, type Sprites } from "./sprites.ts";

/**
 * Chọn khung hình nhàn rỗi (idle frames 0, 1, 2 của S01) cho ngựa trong chuồng.
 * Nếu bật reducedMotion: luôn cố định ở khung 0 (không nhúc nhích).
 */
export function stableHorseFrame(time: number, reducedMotion: boolean, phase: number): 0 | 1 | 2 {
  if (reducedMotion) return 0;
  const raw = Math.floor((time + phase * 0.7) * 2) % 3;
  return (((raw % 3) + 3) % 3) as 0 | 1 | 2;
}

/** Vẽ mỗi ngựa đã xếp chỗ: đứng nguyên con, chân tại anchor, vẽ 1:1 (ô 32 px). */
export function drawStableHorses(
  ctx: CanvasRenderingContext2D,
  sprites: Sprites,
  assignments: readonly StableHorseAssignment[],
  time: number,
  reducedMotion: boolean,
): void {
  for (const { horse, anchor } of assignments) {
    const frame = stableHorseFrame(time, reducedMotion, anchor.index);
    drawFrame(ctx, sprites.horse, tinted(sprites.horse, horse.coat), frame, ROW.IDLE, anchor.x, anchor.y, 32);
  }
}
